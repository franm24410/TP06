using System.Collections.Generic;

namespace TP06.Models
{
    /// <summary>
    /// Tabla base de todo objeto interactivo del mapa. "Activo" ya
    /// alcanza para BotonFijo, BotonConstante y Palanca (la diferencia
    /// entre ellos es lógica de juego, no de datos). Los tipos con
    /// parámetros propios usan además una de las tablas "Datos*".
    /// </summary>
    public class Interactivo
    {
        public int IdInteractivo { get; set; }
        public int IdHabitacion { get; set; }
        public TipoInteractivo Tipo { get; set; }
        public string Nombre { get; set; } = string.Empty;

        public float? PosicionX { get; set; }
        public float? PosicionY { get; set; }
        public float? PosicionZ { get; set; }

        /// <summary>
        /// Estado genérico: BotonFijo (una vez true, no vuelve a false),
        /// BotonConstante (true solo mientras se mantiene apretado),
        /// Palanca (se invierte en cada interacción).
        /// </summary>
        public bool Activo { get; set; }

        // Navegación
        public Habitacion Habitacion { get; set; } = null!;

        // Datos extra según el tipo (solo uno debería estar poblado)
        public InteractivoBotonContrarreloj? DatosBotonContrarreloj { get; set; }
        public InteractivoObjetoMovible? DatosObjetoMovible { get; set; }
        public InteractivoLlave? DatosLlave { get; set; }
        public InteractivoPinchos? DatosPinchos { get; set; }

        public ICollection<UsuarioEstadoInteractivo> EstadosPorUsuario { get; set; } = new List<UsuarioEstadoInteractivo>();
    }
}
