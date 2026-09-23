using Microsoft.AspNetCore.Mvc;
using TP06.Models;

namespace TP06.Controllers
{
    public class HomeController : Controller
    {
        private readonly DB _db = new DB();

        private bool Logueado => HttpContext.Session.GetInt32("idUsuario").HasValue;

        // LOGIN / REGISTRO
        public IActionResult Index(string tab = "login")
        {
            if (Logueado) return RedirectToAction("Juego");
            ViewBag.Tab = tab;
            return View();
        }

        // MENÚ PRINCIPAL
        public IActionResult Menu()
        {
            if (!Logueado) return RedirectToAction("Index");
            ViewBag.Nombre = HttpContext.Session.GetString("nombreUsuario");
            return View();
        }

        // TUTORIAL
        public IActionResult Tutorial()
        {
            if (!Logueado) return RedirectToAction("Index");
            ViewBag.Nombre = HttpContext.Session.GetString("nombreUsuario");
            return View();
        }

        [HttpPost]
        public IActionResult Login(string usuario, string contrasenia)
        {
            var u = _db.ValidarLogin(usuario, contrasenia);
            if (u == null)
            {
                ViewBag.Error = "Usuario o contraseña incorrectos.";
                ViewBag.Tab = "login";
                return View("Index");
            }
            HttpContext.Session.SetInt32("idUsuario", u.IdUsuario);
            HttpContext.Session.SetString("nombreUsuario", u.NombreUsuario);
            return RedirectToAction("Menu"); // 🆕 Cambiado de "Juego" a "Menu"
        }

        [HttpPost]
        public IActionResult Registrar(string usuario, string contrasenia, string repetirContrasenia, string nombre, string apellido)
        {
            ViewBag.Tab = "registro";

            // Validaciones básicas
            if (string.IsNullOrWhiteSpace(usuario) || string.IsNullOrWhiteSpace(contrasenia))
            {
                ViewBag.Error = "Usuario y contraseña son obligatorios.";
                return View("Index");
            }

            if (usuario.Length < 3)
            {
                ViewBag.Error = "El usuario debe tener al menos 3 caracteres.";
                return View("Index");
            }

            if (contrasenia != repetirContrasenia)
            {
                ViewBag.Error = "Las contraseñas no coinciden.";
                return View("Index");
            }

            if (contrasenia.Length < 4)
            {
                ViewBag.Error = "La contraseña debe tener al menos 4 caracteres.";
                return View("Index");
            }

            // Verificar que el usuario no exista
            var existente = _db.BuscarUsuarioPorNombre(usuario);
            if (existente != null)
            {
                ViewBag.Error = "El nombre de usuario ya está en uso.";
                return View("Index");
            }

            try
            {
                var nuevo = new Usuario
                {
                    NombreUsuario = usuario.Trim(),
                    Contrasenia = contrasenia,
                    Nombre = string.IsNullOrWhiteSpace(nombre) ? "" : nombre.Trim(),
                    Apellido = string.IsNullOrWhiteSpace(apellido) ? "" : apellido.Trim(),
                    TipoUsuario = "jugador",
                    IdHabitacionActual = 1
                };
                _db.AgregarUsuario(nuevo);

                ViewBag.Exito = "¡Cuenta creada correctamente! Ahora podés iniciar sesión.";
                ViewBag.Tab = "login";
                return View("Index");
            }
            catch (Exception ex)
            {
                ViewBag.Error = "No se pudo registrar el usuario: " + ex.Message;
                return View("Index");
            }
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