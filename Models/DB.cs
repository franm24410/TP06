using System;
using Microsoft.Data.SqlClient;
using Dapper;
using System.Linq;

namespace TP06.Models
{
    public class DB
    {
        private string _cs =
            "Server=localhost;DataBase=JuegoDB;Integrated Security=True;TrustServerCertificate=True;";

        // ---------- LOGIN / REGISTRO ----------
        public Usuario ValidarLogin(string usuario, string contrasenia)
        {
            using (var cn = new SqlConnection(_cs))
            {
                return cn.QueryFirstOrDefault<Usuario>(
                    "SELECT * FROM Usuario WHERE NombreUsuario=@u AND Contrasenia=@p",
                    new { u = usuario, p = contrasenia });
            }
        }

        public Usuario BuscarUsuarioPorNombre(string usuario)
        {
            using (var cn = new SqlConnection(_cs))
            {
                return cn.QueryFirstOrDefault<Usuario>(
                    "SELECT * FROM Usuario WHERE NombreUsuario=@u", new { u = usuario });
            }
        }

        public void AgregarUsuario(Usuario u)
        {
            using (var cn = new SqlConnection(_cs))
            {
                cn.Execute("INSERT INTO Usuario (NombreUsuario,Contrasenia,Nombre,Apellido,TipoUsuario) " +
                           "VALUES (@NombreUsuario,@Contrasenia,@Nombre,@Apellido,@TipoUsuario)", u);
            }
        }

        // ---------- PARTIDA (guardado) ----------
        public void GuardarPartida(int idUsuario, string datos)
        {
            using (var cn = new SqlConnection(_cs))
            {
                cn.Execute(
                    "IF EXISTS (SELECT 1 FROM Partidas WHERE IdUsuario=@id) " +
                    "  UPDATE Partidas SET Datos=@datos, FechaActualizacion=GETDATE() WHERE IdUsuario=@id " +
                    "ELSE " +
                    "  INSERT INTO Partidas (IdUsuario,Datos) VALUES (@id,@datos)",
                    new { id = idUsuario, datos = datos });
            }
        }

        public string CargarPartida(int idUsuario)
        {
            using (var cn = new SqlConnection(_cs))
            {
                return cn.QueryFirstOrDefault<string>(
                    "SELECT Datos FROM Partidas WHERE IdUsuario=@id", new { id = idUsuario });
            }
        }
    }
}