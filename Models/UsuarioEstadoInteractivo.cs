namespace TP06.Models
{
    /// <summary>
    /// Estado guardado por jugador de un interactivo puntual (para que
    /// botones/palancas no se reseteen al volver a entrar a la partida).
    /// Clave primaria compuesta: (IdUsuario, IdInteractivo).
    /// </summary>
    public class UsuarioEstadoInteractivo
    {
        public int IdUsuario { get; set; }
        public int IdInteractivo { get; set; }
        public bool Activo { get; set; }

        public Usuario Usuario { get; set; } = null!;
        public Interactivo Interactivo { get; set; } = null!;
    }
}
