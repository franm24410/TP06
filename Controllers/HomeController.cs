using Microsoft.AspNetCore.Mvc;
using TP06.Models;

namespace TP06.Controllers
{
    public class HomeController : Controller
    {
        private readonly DB _db = new DB();

        private bool Logueado => HttpContext.Session.GetInt32("idUsuario").HasValue;

        // LOGIN
        public IActionResult Index()
        {
            if (Logueado) return RedirectToAction("Juego");
            return View();
        }

        [HttpPost]
        public IActionResult Login(string usuario, string contrasenia)
        {
            var u = _db.ValidarLogin(usuario, contrasenia);
            if (u == null)
            {
                ViewBag.Error = "Usuario o contraseña incorrectos.";
                return View("Index");
            }
            HttpContext.Session.SetInt32("idUsuario", u.IdUsuario);
            HttpContext.Session.SetString("nombreUsuario", u.NombreUsuario);
            return RedirectToAction("Juego");
        }

        // JUEGO
        public IActionResult Juego()
        {
            if (!Logueado) return RedirectToAction("Index");
            ViewBag.Nombre = HttpContext.Session.GetString("nombreUsuario");
            return View();
        }

        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return RedirectToAction("Index");
        }
    }
}