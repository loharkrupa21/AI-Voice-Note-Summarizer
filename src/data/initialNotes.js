// Seed notes matching the reference design in 1.jpg
export const INITIAL_NOTES = [
  {
    id: 1,
    title: "College Notes",
    duration: "2:35",
    durationSeconds: 155,
    date: "22 Sep 2025, 05:12 PM",
    category: "College",
    accuracy: 98,
    audioUrl: "https://actions.google.com/sounds/v1/speech/person_speaking.ogg",
    transcript: "Today in Advanced Computer Architecture, Professor Sharma explained pipelining hazards and branch prediction algorithms. We examined structural, data, and control hazards with pipeline registers. The two-bit saturating counter branch predictor was highlighted as standard in modern superscalar processors. Assignment 3 will cover Tomasulo's algorithm and is due next Wednesday. Make sure to complete the reading for Chapter 4 before the lab session on Friday.",
    summary: "Comprehensive lecture overview of modern CPU pipelining hazards and branch prediction mechanisms. Emphasis was placed on branch predictors in superscalar processors and upcoming project deadlines for Tomasulo's algorithm.",
    keyPoints: [
      "Analysis of Structural, Data, and Control hazards in modern CPU pipelines",
      "Dynamic branch prediction using two-bit saturating counter state machines",
      "Comparison between static compiler scheduling and hardware dynamic scheduling",
      "Assignment 3 on Tomasulo's algorithm due next Wednesday"
    ],
    actionItems: [
      { text: "Complete textbook Chapter 4 reading before Friday lab", done: true },
      { text: "Implement 2-bit branch predictor simulation in C++", done: false },
      { text: "Submit Assignment 3 on Tomasulo's algorithm by Wednesday", done: false }
    ],
    topics: ["Architecture", "Pipelining", "Branch Prediction", "Tomasulo"]
  },
  {
    id: 2,
    title: "Project Discussion",
    duration: "4:12",
    durationSeconds: 252,
    date: "21 Sep 2025, 02:45 PM",
    category: "Work",
    accuracy: 97,
    audioUrl: "https://actions.google.com/sounds/v1/speech/person_speaking.ogg",
    transcript: "During the AI Voice Note Summarizer team sync, Krupa reviewed the frontend architecture and user interface milestones. The team confirmed that the blue-purple gradient theme is finalized and matches all design specs. We agreed that the recording module must support both live microphone capture and audio uploads in MP3, WAV, and M4A formats. Next sprint will focus on testing the speech-to-text pipeline latency and polishing the summary export options for PDF and text downloads.",
    summary: "Cross-functional team sync on AI Voice Note Summarizer. Finalized UI theme guidelines, audio recording & file upload specs, and scheduled latency testing for STT and export formats.",
    keyPoints: [
      "Frontend architecture and blue-purple gradient design system approved",
      "Audio recording pipeline confirmed for live mic and file upload (MP3/WAV/M4A)",
      "Latency optimization planned for AI transcription and summarization",
      "PDF and Markdown export features planned for next release"
    ],
    actionItems: [
      { text: "Review user experience for audio wave visualizer", done: true },
      { text: "Conduct speech recognition latency benchmarks", done: true },
      { text: "Add multi-format note export options (PDF/TXT)", done: false }
    ],
    topics: ["VoiceMind", "UI Design", "Audio Pipeline", "Sprint Goals"]
  },
  {
    id: 3,
    title: "AI Concepts",
    duration: "3:28",
    durationSeconds: 208,
    date: "20 Sep 2025, 11:20 AM",
    category: "Research",
    accuracy: 99,
    audioUrl: "https://actions.google.com/sounds/v1/speech/person_speaking.ogg",
    transcript: "Key takeaways from the Transformer attention mechanism study. Multi-head self-attention computes query, key, and value matrices to allow tokens to attend to different representation subspaces simultaneously. Positional encodings provide sequence order information because attention operations are inherently permutation invariant. We also explored FlashAttention memory optimizations that tile matrix multiplications across GPU SRAM.",
    summary: "Deep dive into Transformer architecture, scaled dot-product attention, multi-head projections, and modern GPU memory optimization through FlashAttention tiling.",
    keyPoints: [
      "Query, Key, and Value dot-product attention mechanics explained",
      "Role of sinusoidal vs rotary positional embeddings (RoPE)",
      "FlashAttention IO-aware memory tiling benefits on modern GPUs",
      "Impact of context window scaling on memory complexity"
    ],
    actionItems: [
      { text: "Synthesize mathematical proof of scaled dot-product variance", done: true },
      { text: "Benchmark FlashAttention vs standard attention memory footprint", done: false }
    ],
    topics: ["Deep Learning", "Transformers", "Self-Attention", "GPU Optimization"]
  },
  {
    id: 4,
    title: "Study Summary",
    duration: "1:50",
    durationSeconds: 110,
    date: "18 Sep 2025, 07:32 PM",
    category: "Personal",
    accuracy: 96,
    audioUrl: "https://actions.google.com/sounds/v1/speech/person_speaking.ogg",
    transcript: "Personal study summary for Database Management Systems. Covered ACID properties, write-ahead logging, two-phase locking for concurrency control, and B-tree vs LSM-tree storage engines. B-trees excel at read-heavy workloads with clustered indexes, whereas Log-Structured Merge trees provide higher write throughput for append-only distributed storage.",
    summary: "Quick review of relational database transaction guarantees, concurrency control mechanisms, and trade-offs between B-Tree and LSM-Tree storage architectures.",
    keyPoints: [
      "ACID transactions and isolation levels (Read Committed vs Serializable)",
      "Two-phase locking (2PL) preventing concurrency anomalies",
      "Storage engine trade-offs: B-Trees (read-optimized) vs LSM-Trees (write-optimized)"
    ],
    actionItems: [
      { text: "Draft summary diagram comparing B-Tree and LSM write paths", done: true },
      { text: "Practice SQL isolation level concurrency exercises", done: false }
    ],
    topics: ["Databases", "ACID", "Concurrency", "Storage Engines"]
  }
];
