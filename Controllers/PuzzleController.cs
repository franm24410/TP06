using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace TP06.Controllers
{
    public class PuzzleController : Controller
    {
        private string _connectionString = 
            @"Server=localhost;DataBase=JuegoDB;Integrated Security=True;TrustServerCertificate=True;";

        [HttpPost]
        public IActionResult Complete()
        {
            try
            {
                string query = @"INSERT INTO PuzzleCompletions (Completado, FechaCompletado) 
                                 VALUES (1, GETDATE())";

                using (SqlConnection connection = new SqlConnection(_connectionString))
                {
                    connection.Open();
                    using (SqlCommand cmd = new SqlCommand(query, connection))
                    {
                        cmd.ExecuteNonQuery();
                    }
                }

                return Json(new { success = true, mensaje = "Puzzle guardado como completado" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, mensaje = ex.Message });
            }
        }
    }
}