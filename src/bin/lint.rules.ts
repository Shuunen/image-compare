export type Rule = {
  check: (content: string) => boolean
  error: string
  fixer?: (content: string, filePath: string) => string
  name: string
}

const regexExclusiveTest = /\.(?<method>only|skip)\(/
const regexTestBlock = /\b(?:it|test)\((?:[^()]|\([^()]*\))*,\s*(?:async\s*)?\(\)\s*=>\s*\{(?<body>[\s\S]*?)\n\s*\}\)/g

function testBlockBodies(content: string): string[] {
  const bodies: string[] = []
  for (const match of content.matchAll(regexTestBlock)) {
    const [, body] = match
    if (body !== undefined) bodies.push(body)
  }
  return bodies
}

function hasNoBlankLinesInTests(content: string): boolean {
  return testBlockBodies(content).every(body => !/\n\s*\n/.test(body))
}

export const rules: Rule[] = [
  {
    check: (content: string) => !regexExclusiveTest.test(content),
    error: 'must not use .only(...) or .skip(...) on test blocks',
    name: 'no exclusive tests',
  },
  {
    check: (content: string) => !content.includes('toBeInTheDocument('),
    error: 'toBeInTheDocument() is redundant after getBy*/getAllBy* queries, use a more specific assertion',
    name: 'no toBeInTheDocument',
  },
  {
    check: (content: string) => hasNoBlankLinesInTests(content),
    error: 'test blocks (it/test) must not contain blank lines used for visual spacing',
    name: 'no blank lines in tests',
  },
]
