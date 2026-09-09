using Microsoft.Data.SqlClient;

namespace TP06.Models 
{

    public static class DB
    {
        private static string _connectionString =
            @"Server=localhost\SQLEXPRESS;DataBase=JuegoDB;Integrated Security=True;TrustServerCertificate=True;";
        public static int ExecuteNonQuery(string sql)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                var command = new SqlCommand(sql, connection);
                return command.ExecuteNonQuery();
            }
        }

        public static object ExecuteScalar(string sql)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                var command = new SqlCommand(sql, connection);
                return command.ExecuteScalar();
            }
        }

        public static void GuardarPuzzleCompletado()
        {
            ExecuteNonQuery(
                "INSERT INTO PuzzleCompletions (Completado, FechaCompletado) VALUES (1, GETDATE())"
            );
        }
    }
}