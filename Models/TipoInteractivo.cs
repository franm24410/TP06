namespace TP06.Models
{
    /// <summary>Tipos de objeto interactivo definidos para el juego.</summary>
    public enum TipoInteractivo
    {
        /// <summary>Se toca una vez y se mantiene activo para siempre.</summary>
        BotonFijo,

        /// <summary>Se activa y se desactiva solo pasado un tiempo.</summary>
        BotonContrarreloj,

        /// <summary>Solo está activo mientras se lo mantiene apretado.</summary>
        BotonConstante,

        /// <summary>Objeto con colisión que se mueve/agranda al interactuar (tecla E).</summary>
        ObjetoMovible,

        /// <summary>Como el botón fijo, pero vuelve a interactuar lo desactiva.</summary>
        Palanca,

        /// <summary>Item que abre una puerta específica.</summary>
        Llave,

        /// <summary>Bloquea el paso hasta cumplir una condición; luego se desactiva.</summary>
        Pinchos
    }
}
