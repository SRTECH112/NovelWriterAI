import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { StoryBible } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { storyBible, volumeCount, chaptersPerVolume } = body;

    if (!storyBible) {
      return NextResponse.json(
        { error: 'Story Bible is required' },
        { status: 400 }
      );
    }

    const bible = storyBible as StoryBible;
    const sections = bible.structured_sections;

    const systemPrompt = `You are a Multi-Volume Story Architect for serialized fiction (anime light novels, Wattpad romances, web novels).

Your task is to create a VOLUME/ACT structure that supports long-form, binge-readable storytelling.

VOLUME STRUCTURE RULES:
1. Each volume is a complete emotional arc with its own theme
2. Volumes build on each other (escalating stakes, deepening relationships)
3. Each volume has a satisfying payoff while advancing the overall story
4. Relationship states evolve across volumes

ACT STRUCTURE RULES (per volume):
1. Each volume contains 4-6 acts
2. Acts follow emotional escalation:
   - Act 1: Setup (slow pacing, establish dynamics)
   - Act 2-3: Rising Tension (medium pacing, proximity, misunderstandings)
   - Act 4: Fracture/Crisis (fast pacing, confrontation, revelation)
   - Act 5: Resolution (medium pacing, reconciliation)
   - Act 6: Payoff (slow pacing, emotional closure)
3. Each act has a clear narrative purpose
4. Emotional pressure escalates from 3/10 → 9/10 across acts

CHAPTER DISTRIBUTION:
- Each act contains 3-7 chapters
- Total chapters per volume: ${chaptersPerVolume || 20}
- Chapters within acts follow the act's pacing

OUTPUT FORMAT (JSON):
{
  "volumes": [
    {
      "volumeNumber": 1,
      "title": "Volume title",
      "theme": "Core theme of this volume",
      "emotionalPromise": "What emotional payoff this volume delivers",
      "relationshipStateStart": "Where relationships begin",
      "relationshipStateEnd": "Where relationships end up",
      "majorTurningPoint": "Key event that defines this volume",
      "acts": [
        {
          "actNumber": 1,
          "title": "Act title (optional)",
          "narrativePurpose": "setup|rising-tension|fracture|crisis|resolution|payoff",
          "pacing": "slow|medium|fast",
          "emotionalPressure": 3,
          "characterDevelopmentFocus": "What character growth happens",
          "targetChapterCount": 5,
          "chapterBeats": [
            {
              "chapterNumber": 1,
              "title": "Chapter title",
              "emotionalBeat": "What emotion/moment this chapter captures",
              "relationshipShift": "How relationships change",
              "sceneGoal": "What this chapter accomplishes",
              "hookToNext": "Cliffhanger or question for next chapter"
            }
          ]
        }
      ]
    }
  ]
}`;

    const userPrompt = `Create a ${volumeCount || 3}-volume outline for this story:

STORY BIBLE:
World Rules: ${sections.worldRules.join('; ')}
Themes: ${sections.themesTone.join('; ')}
Factions: ${sections.factions.map(f => f.name).join(', ')}
Hard Constraints: ${sections.hardConstraints.join('; ')}

Genre: ${bible.metadata.genre || 'Not specified'}
Tone: ${bible.metadata.tone || 'Not specified'}
POV: ${bible.metadata.pov || 'Not specified'}

Create a compelling multi-volume structure with:
- ${volumeCount || 3} volumes
- Each volume with 4-6 acts
- Approximately ${chaptersPerVolume || 20} chapters per volume
- Clear emotional escalation across volumes
- Satisfying payoffs at volume and act boundaries

Return valid JSON only.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 16000,
      temperature: 0.7,
      messages: [
        { role: 'user', content: systemPrompt + '\n\n' + userPrompt }
      ],
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    let result;
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      result = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse AI response:', textContent.text);
      throw new Error('Invalid JSON response from AI');
    }

    return NextResponse.json({ volumeOutline: result });
  } catch (error: any) {
    console.error('Error generating volume outline:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate volume outline' },
      { status: 500 }
    );
  }
}
