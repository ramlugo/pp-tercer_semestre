/**
 * @file app.js
 * @module Controlador/Principal
 * @description Punto de entrada y orquestador principal de Agromaguey Pro (VADE Software).
 *
 * Este módulo ES6 actúa como el único punto de carga del sistema de módulos.
 * Importa todas las funciones necesarias de las capas de Vista y Core,
 * gestiona el estado global de la aplicación, y expone las funciones
 * requeridas por los atributos onclick del HTML al objeto global window.
 *
 * Responsabilidades:
 * - Mantener el estado mutable del proyecto activo y el historial de simulaciones.
 * - Activar escenarios alternativos (destilación, cultivos intercalados).
 * - Inicializar y vincular los eventos del módulo microeconómico.
 * - Servir de puente entre los módulos ES6 y el scope global del DOM.
 */

// =====================================================================
// IMPORTACIONES
// =====================================================================

import {
    irAlWizard,
    irAInformativa,
    irPaso,
    toggleTipoCosecha,
    prepararPaso3,
    crearProyecto,
    renderizarEscenarioBase,
    renderizarMicroeconomia,
    generarEstadoResultados,
    cerrarEstadoResultados,
    alternarVistaGrafica,
    inicializarControlesEscenario
} from './src/ui/dashboard.js';
import { AppState } from './src/config/constantes.js';

// =====================================================================
// ESTADO GLOBAL DE LA APLICACIÓN
// =====================================================================

/**
 * Estado mutable del proyecto de simulación actualmente activo.
 * Es poblado por el asistente de configuración (wizard) y consultado
 * por todas las funciones de cálculo y renderizado.
 * @type {Object}
 */
const proyectoActual = {};

/**
 * Registro acumulado de simulaciones ejecutadas durante la sesión.
 * Permite al usuario comparar resultados entre diferentes escenarios.
 * @type {Array<Object>}
 */
const historialSimulaciones = [];

// =====================================================================
// FUNCIONES DEL CONTROLADOR
// =====================================================================



/**
 * Inicializa los controles interactivos del módulo de análisis microeconómico.
 *
 * Vincula los eventos del switch de palenque propio y el slider de precio
 * de venta con la función de renderizado del modelo de oferta y demanda.
 * Ejecuta un renderizado inicial para sincronizar el estado visual con
 * los datos del proyecto activo.
 *
 * @returns {void}
 */
function inicializarMicroeconomia() {
    document.getElementById('togglePalenque').addEventListener('change', () => {
        renderizarMicroeconomia(proyectoActual);
    });

    document.getElementById('sliderPrecio').addEventListener('input', (e) => {
        document.getElementById('valorPrecio').innerText = `$${e.target.value}`;
        renderizarMicroeconomia(proyectoActual);
    });
    
    renderizarMicroeconomia(proyectoActual);
}

// =====================================================================
// INICIALIZACIÓN DE EVENTOS DEL DOM
// =====================================================================

/**
 * Vincula de manera programática todos los event listeners del DOM,
 * eliminando la necesidad de bindings onclick/onchange inline en el HTML.
 * Implementa delegación de eventos para componentes creados dinámicamente.
 *
 * @returns {void}
 */
function inicializarEventos() {
    // Inicializar controles de escenario dinámico
    inicializarControlesEscenario(proyectoActual);

    // 1. Navegación e inicio
    const btnIrWizard = document.getElementById('btn-ir-wizard');
    if (btnIrWizard) btnIrWizard.addEventListener('click', irAlWizard);

    const btnIrInformativa = document.getElementById("btn-ir-informativa");
    if (btnIrInformativa) {
        btnIrInformativa.addEventListener("click", () => {
            document.getElementById("seccion-gestion").classList.add("hidden");
            document.getElementById("seccion-informativa").classList.remove("hidden");
        });
    }

    const btnThemeToggle = document.getElementById("btn-theme-toggle");
    if (btnThemeToggle) {
        btnThemeToggle.addEventListener("click", () => {
            document.body.classList.toggle("light-theme");
            if (document.body.classList.contains("light-theme")) {
                btnThemeToggle.innerHTML = "🌙";
            } else {
                btnThemeToggle.innerHTML = "☀️";
            }
        });
    }

    // 2. Navegación del Asistente (Wizard)
    const btnStep1Next = document.getElementById('btn-wizard-step1-next');
    if (btnStep1Next) btnStep1Next.addEventListener('click', () => irPaso(2));

    const wEstado = document.getElementById('w-estado');
    if (wEstado) wEstado.addEventListener('change', toggleTipoCosecha);

    const btnStep2Back = document.getElementById('btn-wizard-step2-back');
    if (btnStep2Back) btnStep2Back.addEventListener('click', () => irPaso(1));

    const btnStep2Next = document.getElementById('btn-wizard-step2-next');
    if (btnStep2Next) btnStep2Next.addEventListener('click', prepararPaso3);

    const btnStep3Back = document.getElementById('btn-wizard-step3-back');
    if (btnStep3Back) btnStep3Back.addEventListener('click', () => irPaso(2));

    const btnCrearProyecto = document.getElementById('btn-wizard-crear-proyecto');
    if (btnCrearProyecto) {
        btnCrearProyecto.addEventListener('click', () => crearProyecto(proyectoActual, inicializarMicroeconomia));
    }

    // 3. Vista de Estado de Resultados
    const btnCerrarEr = document.getElementById('btn-cerrar-er');
    if (btnCerrarEr) btnCerrarEr.addEventListener('click', cerrarEstadoResultados);

    // 4. Delegación de eventos para elementos dinámicos en la tabla de inventario
    const tablaBody = document.getElementById('tabla-body');
    if (tablaBody) {
        tablaBody.addEventListener('click', (e) => {
            const btnVerLote = e.target.closest('.btn-ver-lote');
            if (btnVerLote) {
                const anio = parseInt(btnVerLote.getAttribute('data-anio'));
                generarEstadoResultados(anio, proyectoActual);
            }
        });
    }

    // 5. Delegación de eventos para el botón en el Estado Vacío (Empty State)
    const vistaTabla = document.getElementById('vista-tabla');
    if (vistaTabla) {
        vistaTabla.addEventListener('click', (e) => {
            if (e.target.id === 'btn-empty-state-wizard') {
                irAlWizard();
            }
        });
    }



    // 7. Delegación de eventos para el Toggle de Gráficas
    const contenedorToggle = document.querySelector('.toggle-grafica');
    if (contenedorToggle) {
        contenedorToggle.addEventListener('change', (e) => {
            if (e.target.name === 'vistaGrafica') {
                // Actualizar estilos del Toggle
                document.querySelectorAll('.toggle-grafica .toggle-label').forEach(lbl => {
                    lbl.style.background = 'transparent';
                    lbl.style.color = '#9ca3af';
                });
                const activeLabel = e.target.closest('label');
                activeLabel.style.background = 'var(--primary)';
                activeLabel.style.color = 'white';
                
                // Ejecutar actualización de la gráfica
                alternarVistaGrafica(e.target.value);
            }
        });
    }
}

// Ejecutar vinculación de eventos al cargar el módulo
inicializarEventos();