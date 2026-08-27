namespace TP06.Models
{
    /// <summary>
    /// Estado guardado por jugador de una puerta (abierta/cerrada).
    /// Clave primaria compuesta: (IdUsuario, IdPuerta).
    /// </summary>
    public class UsuarioEstadoPuerta
    {
        public int IdUsuario { get; set; }
        public int IdPuerta { get; set; }
        public bool EstaAbierta { get; set; }

        public Usuario Usuario { get; set; } = null!;
        public Puerta Puerta { get; set; } = null!;
    }
}
