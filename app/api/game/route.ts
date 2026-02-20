import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { z } from 'zod';

const gameSchema = z.object({
  locationName: z.string().describe("Short location name (2-4 words)"),
  description: z.string().describe("Engaging description (3-5 sentences, 80-120 words)"),
  hp: z.number().describe("The player's new Health Points (0-100). Decrease this if the player makes a mistake or takes damage."),
  hpChangeReason: z.string().nullable().describe("Brief reason for HP change (1 sentence). Return null if no change."),
  inventory: z.array(z.string()),
  choices: z.array(
    z.object({
      label: z.string().describe("Short action label (5-8 words max)"),
      actionId: z.string(),
      risk: z.enum(['safe', 'minor', 'moderate', 'major']).describe("Risk level of this choice")
    })
  ).max(4)
});

export async function POST(req: Request) {
  const { history, currentHp, inventory } = await req.json();

  const context = history.map((h: any) => 
    `Player Action: ${h.action} | Result: ${h.result}`
  ).join('\n');

  const inventoryList = inventory?.length > 0 ? inventory.join(', ') : 'nothing';

  const result = await streamObject({
    model: openai('gpt-4o'),
    schema: gameSchema,
    prompt: `
You are an ENGAGING text adventure game master. Create immersive, dramatic scenarios.

Current State:
- HP: ${currentHp}/100
- Inventory: ${inventoryList}
- Last Action: "${history[history.length - 1]?.action || 'START_GAME'}"

STORYTELLING RULES:
1. Write engaging descriptions (3-5 sentences, 80-120 words)
2. Be vivid and immersive
3. Create tension and atmosphere
4. Focus on immediate situation

HP SYSTEM - CRITICAL:
You MUST return the CALCULATED new HP value:
- Safe actions: Return hp: ${currentHp} (no change)
- Minor risk: Return hp: ${Math.max(0, currentHp - 10)} (subtract 8-12)
- Moderate risk: Return hp: ${Math.max(0, currentHp - 20)} (subtract 18-25)
- Major risk: Return hp: ${Math.max(0, currentHp - 40)} (subtract 35-50)

EXAMPLES:
- If current HP is ${currentHp} and player takes minor damage, return hp: ${Math.max(0, currentHp - 10)}
- If current HP is ${currentHp} and player takes moderate damage, return hp: ${Math.max(0, currentHp - 20)}

Provide brief hpChangeReason when HP changes.
If HP reaches 0, write short death scene, return empty choices [].

CHOICES:
- Give 4 diverse choices with clear risk levels
- Label each choice with correct risk: 'safe', 'minor', 'moderate', or 'major'
- Make risky choices actually cause HP loss

Create ENGAGING modern scenarios: heists, escapes, mysteries, survival situations.
    `,
  });

  return result.toTextStreamResponse();
}