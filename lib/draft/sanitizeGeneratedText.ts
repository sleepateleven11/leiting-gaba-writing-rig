const explanationPrefixes = [
  /^以下是[^：:]*[:：]\s*/i,
  /^下面是[^：:]*[:：]\s*/i,
  /^改写后如下[:：]?\s*/i,
  /^这是改写后的版本[:：]?\s*/i,
  /^好的[，,。]\s*/i,
  /^当然[，,。]\s*/i
];

export function sanitizeGeneratedText(text: string) {
  let next = text.replace(/\r\n/g, "\n");

  next = next.replace(/```(?:\w+)?/g, "");
  next = next.replace(/\*\*(.*?)\*\*/g, "$1");
  next = next.replace(/(^|\n)\s*#{1,6}\s+/g, "$1");
  next = next.replace(/(^|\n)\s*-{3,}\s*(?=\n|$)/g, "$1");
  next = next.replace(/(^|\n)\s*>{3,}\s*/g, "$1");

  for (const prefix of explanationPrefixes) {
    next = next.replace(prefix, "");
  }

  next = next
    .replace(/综上所述[，,]?/g, "说到底，")
    .replace(/值得注意的是[，,]?/g, "")
    .replace(/在当今(?:快速发展)?的时代[，,]?/g, "")
    .replace(/首先[，,]/g, "")
    .replace(/其次[，,]/g, "")
    .replace(/最后[，,]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimStart();

  return next;
}

export function sanitizeStreamingText(text: string) {
  return sanitizeGeneratedText(text).replace(/\n{4,}/g, "\n\n");
}
