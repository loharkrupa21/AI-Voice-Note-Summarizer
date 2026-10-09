const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'by', 'for', 'from',
  'had', 'has', 'have', 'he', 'her', 'his', 'i', 'in', 'is', 'it', 'its',
  'of', 'on', 'or', 'our', 'she', 'that', 'the', 'their', 'them', 'there',
  'they', 'this', 'to', 'was', 'we', 'were', 'will', 'with', 'you', 'your',
]);

const ACTION_PATTERN = /\b(?:action item|todo|to-do|need to|needs to|must|should|please|complete|finish|submit|prepare|review|send|schedule|follow up|follow-up|deadline|due|remember to|plan to|ensure)\b|करें|करना|जमा करें|पूरा करें/i;

function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .match(/[^.!?।]+[.!?।]?/gu)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) || [];
}

function getWords(text) {
  return text.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
}

function rankSentences(sentences) {
  const frequencies = new Map();
  sentences.forEach((sentence) => {
    getWords(sentence).forEach((word) => {
      if (!STOP_WORDS.has(word) && word.length > 2) {
        frequencies.set(word, (frequencies.get(word) || 0) + 1);
      }
    });
  });

  return sentences
    .map((sentence, index) => {
      const words = getWords(sentence).filter((word) => !STOP_WORDS.has(word) && word.length > 2);
      const score = words.reduce((total, word) => total + (frequencies.get(word) || 0), 0) /
        Math.max(1, Math.sqrt(words.length));
      return { sentence, index, score };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index);
}

export function summarizeTranscript(transcript, { format = 'key-points', detailLevel = 'balanced' } = {}) {
  const sentences = splitSentences(transcript.trim());
  if (sentences.length === 0) {
    throw new Error('Enter a transcript before generating a summary.');
  }

  const ranked = rankSentences(sentences);
  const sentenceLimit = format === 'tldr'
    ? 1
    : detailLevel === 'concise' ? 1 : detailLevel === 'comprehensive' ? 3 : 2;
  const summarySentences = ranked
    .slice(0, Math.min(sentenceLimit, sentences.length))
    .sort((a, b) => a.index - b.index)
    .map(({ sentence }) => sentence);
  const pointLimit = detailLevel === 'comprehensive' ? 5 : 3;
  const keyPoints = ranked
    .slice(0, Math.min(pointLimit, sentences.length))
    .sort((a, b) => a.index - b.index)
    .map(({ sentence }) => sentence);
  const actionItems = sentences
    .filter((sentence) => ACTION_PATTERN.test(sentence))
    .slice(0, 5)
    .map((text) => ({ text, done: false }));
  const topics = [...new Set(
    ranked.flatMap(({ sentence }) => getWords(sentence))
      .filter((word) => !STOP_WORDS.has(word) && word.length > 3)
  )].slice(0, 4).map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1));

  return {
    summary: summarySentences.join(' '),
    keyPoints,
    actionItems,
    topics,
    format,
  };
}
