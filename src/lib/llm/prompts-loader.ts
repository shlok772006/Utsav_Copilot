import fs from 'fs';
import path from 'path';

export type PromptId = 'intake' | 'change' | 'advise' | 'ideas' | 'quote';

/**
 * Loads a versioned prompt markdown file from the /prompts directory
 * and replaces template placeholders `{{key}}` with sanitized strings.
 *
 * Ensures data passed as user input or quotes is enclosed in proper XML fencing.
 */
export function loadPrompt(
  promptId: PromptId,
  variables: Record<string, unknown>,
  version = 'v1'
): string {
  const filePath = path.join(process.cwd(), 'prompts', `${promptId}.${version}.md`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Prompt file not found at ${filePath}`);
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    let formattedValue = '';

    if (value === null || value === undefined) {
      formattedValue = 'null';
    } else if (typeof value === 'object') {
      formattedValue = JSON.stringify(value, null, 2);
    } else {
      formattedValue = String(value);
    }

    content = content.replaceAll(placeholder, formattedValue);
  }

  return content;
}
