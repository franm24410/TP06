using Microsoft.AspNetCore.Mvc;
using TP06.Models;

namespace TP06.Controllers
{
    public class PartidaController : Controller
    {
        private readonly DB _db = new DB();

        public class GuardarDto { public string Datos { get; set; } }

        [HttpPost]
        public IActionResult Guardar([FromBody] GuardarDto dto)
        {
            var id = HttpContext.Session.GetInt32("idUsuario");
            if (id == null) return Unauthorized();
            _db.GuardarPartida(id.Value, dto.Datos ?? "{}");
            return Ok(new { ok = true });
        }

        [HttpGet]
        public IActionResult Cargar()
        {
            var id = HttpContext.Session.GetInt32("idUsuario");
            if (id == null) return Unauthorized();
            var datos = _db.CargarPartida(id.Value);
            return Ok(new { datos = datos ?? "" });
        }
    }
}