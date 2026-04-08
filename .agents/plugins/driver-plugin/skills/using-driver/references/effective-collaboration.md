# Working Effectively with Your AI Partner

These practical techniques make the DRIVER workflow more effective, regardless of which AI coding assistant you use.

## Persistent Artifacts as Shared State

Every DRIVER stage produces a markdown file — research.md, product-overview.md, roadmap.md, spec files. These are not throwaway chat outputs. They are your **shared mutable state**:
- They survive context window limits (chat history gets compressed; files don't)
- They enable asynchronous review (read at your own pace, catch mistakes your AI partner missed)
- They serve as review surfaces where you annotate corrections

**Rule:** If research, a plan, or a decision lives only in chat, it will get lost. Write it to a file.

## The Annotation Cycle

After your AI partner writes a plan or spec, don't just say "looks good." Review it in your editor:

1. Your AI partner writes the plan/spec to a markdown file
2. You open it in your editor and add inline notes (corrections, domain knowledge, rejected approaches)
3. Send it back: "Update based on my annotations — don't implement yet"
4. Your AI partner revises the document
5. Repeat steps 1-4 until the plan is right (typically 1-6 rounds)

**This is where the real creative work happens.** Implementation should be mechanical — the hard thinking is in the annotation cycle.

Example annotations:
- "Use numpy-financial for NPV, not a manual loop"
- "Remove this section — we don't need caching"
- "Wrong formula — discount rate should compound, not simple interest"
- "Restructure: visibility belongs on the portfolio, not individual positions"

## Deep-Read Signaling

When asking your AI partner to research or understand existing code, signal the depth you need:
- "Read this module **deeply** — understand every edge case"
- "Research the **intricacies** of how this library handles missing data"
- "Don't stop until you've found **all** the issues"

Surface-level skimming is the default you're fighting against. Language that signals rigor gets meaningfully different results.

## Active Steering

Never grant total autonomy. Make item-level decisions on proposals:
- Accept what's good as-is
- Modify approaches that need refinement: "for the first one, use vectorized NumPy; restructure the third into a separate module"
- Reject what's unnecessary: "ignore items 4 and 5"
- Inject domain knowledge your AI partner doesn't have

Your domain knowledge + AI's pattern matching = better than either alone.

## Terse Feedback During Execution

Once a solid plan exists (after the annotation cycle), corrections collapse to single sentences:
- "Move the settings to a separate page"
- "Use Promise.all here"
- "Wider"

The plan provides enough context. You don't need to re-explain the whole project with every correction.

## Revert and Re-scope

When implementation heads in the wrong direction — complexity exploding, approach not working, results look wrong — **don't patch**. Discard the changes and narrow the scope. A clean restart with tighter constraints beats incremental fixes on a broken foundation.

## Reference Implementations

When you've seen a good pattern in open source or another codebase, share it alongside planning requests: "This is how [library X] handles portfolio rebalancing — write a plan adapting this approach for our use case." Reference code accelerates planning dramatically.
