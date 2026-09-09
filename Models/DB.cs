using Microsoft.Data.SqlClient;
using Dapper;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace TP06.Models
{
    public class DB
    {
        private string _connectionString =
            @"Server=localhost;DataBase=JuegoDB;Integrated Security=True;TrustServerCertificate=True;";

        // ============================================
        // LOGIN Y REGISTRO
        // ============================================

        public Usuario BuscarUsuarioPorNombre(string nombreUsuario)
        {
            Usuario miUsuario = null;

            string query = "SELECT * FROM Usuario WHERE NombreUsuario = @pNombreUsuario";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                miUsuario = connection.QueryFirstOrDefault<Usuario>(query, new
                {
                    pNombreUsuario = nombreUsuario
                });
            }

            return miUsuario;
        }

        public void AgregarUsuario(Usuario usuario)
        {
            string query = "INSERT INTO Usuario (NombreUsuario, Contrasenia, Nombre, Apellido, TipoUsuario) " +
                           "VALUES (@pNombreUsuario, @pContrasenia, @pNombre, @pApellido, @pTipoUsuario)";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Execute(query, new
                {
                    pNombreUsuario = usuario.NombreUsuario,
                    pContrasenia = usuario.Contrasenia,
                    pNombre = usuario.Nombre,
                    pApellido = usuario.Apellido,
                    pTipoUsuario = usuario.TipoUsuario
                });
            }
        }

        public Usuario ValidarLogin(string nombreUsuario, string contrasenia)
        {
            Usuario miUsuario = null;

            string query = "SELECT * FROM Usuario WHERE NombreUsuario = @pNombreUsuario AND Contrasenia = @pContrasenia";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                miUsuario = connection.QueryFirstOrDefault<Usuario>(query, new
                {
                    pNombreUsuario = nombreUsuario,
                    pContrasenia = contrasenia
                });
            }

            return miUsuario;
        }

        // ============================================
        // PUZZLE DE BOTONES
        // ============================================

        public void GuardarPuzzleCompletado(PuzzleCompletionRequest request)
        {
            string query = @"INSERT INTO PuzzleCompletions 
                             (Completado, PuzzlesCompletados, Detalle, FechaCompletado) 
                             VALUES 
                             (1, @pPuzzlesCompletados, @pDetalle, @pFecha)";

            string detalle = "";
            if (request.Puzzles != null && request.Puzzles.Count > 0)
            {
                detalle = string.Join(", ", request.Puzzles.Select(p => p.Id));
            }

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Execute(query, new
                {
                    pPuzzlesCompletados = request.PuzzlesCompleted,
                    pDetalle = detalle,
                    pFecha = request.CompletedAt
                });
            }
        }

        public bool PuzzleYaCompletado()
        {
            string query = "SELECT COUNT(1) FROM PuzzleCompletions WHERE Completado = 1";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                int cantidad = connection.QueryFirst<int>(query);
                return cantidad > 0;
            }
        }
    }
}