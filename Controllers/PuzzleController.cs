using Microsoft.AspNetCore.Mvc;
using TP06.Models;
namespace TP06.Controllers 
{
    [ApiController]
    [Route("api/[controller]")]
    public class PuzzleController : ControllerBase
    {
        [HttpPost("Complete")]
        public IActionResult Complete()
        {
            DB.GuardarPuzzleCompletado();
            return Ok(new { mensaje = "Puzzle guardado como completado" });
        }
    }
}