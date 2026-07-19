# Bilibili Content Extraction

This context defines the language used when reading navigable video content through the MCP server.

## Language

**Video**:
A Bilibili work identified by one BVID. A Video may contain one or more Parts.
_Avoid_: Archive, post

**Part**:
One independently playable item within a Video, identified publicly by a one-based page number and internally by a CID.
_Avoid_: Episode, segment, P-video

**Subtitle Segment**:
One timed subtitle cue containing start time, end time, and text.
_Avoid_: Chapter, caption block

**Transcript Range**:
A requested time interval used to select overlapping Subtitle Segments from one Part.
_Avoid_: Chapter range, clip

**Chapter**:
A named time interval supplied by Bilibili for one Part. Chapters are returned as provided and are never inferred by this server.
_Avoid_: Subtitle Segment, AI chapter
