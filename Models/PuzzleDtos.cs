using System;
using System.Collections.Generic;

namespace TP06.Models
{
    public class PuzzleCompletionRequest
    {
        public int PuzzlesCompleted { get; set; }
        public DateTime CompletedAt { get; set; }
        public List<PuzzleDetalle> Puzzles { get; set; } = new List<PuzzleDetalle>();
    }

    public class PuzzleDetalle
    {
        public string Id { get; set; }
        public bool Solved { get; set; }
    }
}