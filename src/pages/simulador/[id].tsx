import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Papa from 'papaparse'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const Mapa = dynamic(() => import('@/components/Mapa'), { ssr: false })

interface RegistroCSV {
  fecha: string
  indicativo: string
  nombre: string
  latitud: string
  longitud: string
  tmed: string
  prec: string
  velmedia: string
}

interface PredRow {
  fecha: string
  indice: string
  pred: string
}

interface IndiceMap {
  indice: string
  indicativo: string
}

export default function EstacionSimulada() {
  const router = useRouter()
  const { id } = router.query
  const [registros, setRegistros] = useState<RegistroCSV[]>([])
  const [estacion, setEstacion] = useState<RegistroCSV | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(2023)
  const [rangeStart, setRangeStart] = useState<number | null>(null)
  const [rangeEnd, setRangeEnd] = useState<number | null>(null)
  const [pred1, setPred1] = useState<{ [fecha: string]: number }>({})
  const [pred3, setPred3] = useState<{ [fecha: string]: number }>({})
  const [windPred, setWindPred] = useState<{ [fecha: string]: number }>({})
  const [windPred3, setWindPred3] = useState<{ [fecha: string]: number }>({})
  const [precPred, setPrecPred] = useState<{ [fecha: string]: number }>({})
  const [precPred3, setPrecPred3] = useState<{ [fecha: string]: number }>({})

  useEffect(() => {
    if (!id) return

    const fetchDatos = async () => {
      const res = await fetch(`/api/estacion/${id}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setRegistros(data)
        if (data.length > 0) setEstacion(data[0])
      }
    }

    const cargarPredicciones = async (
      archivo: string,
      asignacion: string,
      setter: (data: { [fecha: string]: number }) => void
    ) => {
      const parseCSV = async <T,>(ruta: string): Promise<T[]> => {
        const res = await fetch(ruta)
        const text = await res.text()
        console.log(text)
        const parsed = Papa.parse<T>(text, { header: true, skipEmptyLines: true })
        return parsed.data
      }

      const [predData, mapping] = await Promise.all([
        parseCSV<PredRow>(`/${archivo}`),
        parseCSV<IndiceMap>(`/${asignacion}`),
      ])

      const entrada = mapping.find(m => m.indicativo === id)
      if (!entrada) return
      const predMap: { [fecha: string]: number } = {}
      predData.filter(p => p.indice === entrada.indice).forEach(p => {
        predMap[p.fecha] = parseFloat(p.pred)
      })
      setter(predMap)
    }

    fetchDatos()
    cargarPredicciones('predicciones__tmed_h1.csv', 'asignacion_indice_indicativo.csv', setPred1)
    cargarPredicciones('predicciones__tmed_h3.csv', 'asignacion_indice_indicativo.csv', setPred3)
    cargarPredicciones('predicciones__prec_h1.csv', 'asignacion_indice_indicativo.csv', setPrecPred)
    cargarPredicciones('predicciones__prec_h3.csv', 'asignacion_indice_indicativo.csv', setPrecPred3)
    cargarPredicciones('predicciones__velmedia_h1.csv', 'asignacion_indice_indicativo.csv', setWindPred)
    cargarPredicciones('predicciones__velmedia_h3.csv', 'asignacion_indice_indicativo.csv', setWindPred3)
  }, [id])

  const isMonthSelected = (monthIndex: number) => {
    if (rangeStart === null) return false
    if (rangeEnd === null) return rangeStart === monthIndex
    return monthIndex >= Math.min(rangeStart, rangeEnd) && monthIndex <= Math.max(rangeStart, rangeEnd)
  }

  const handleMonthClick = (monthIndex: number) => {
    if (rangeStart === null || (rangeStart !== null && rangeEnd !== null)) {
      setRangeStart(monthIndex)
      setRangeEnd(null)
    } else {
      setRangeEnd(monthIndex)
    }
  }

  const datosFiltrados = registros.filter(r => {
    const fecha = new Date(r.fecha)
    const mes = fecha.getMonth()
    return (
      fecha.getFullYear() === selectedYear &&
      rangeStart !== null &&
      mes >= Math.min(rangeStart, rangeEnd ?? rangeStart) &&
      mes <= Math.max(rangeStart, rangeEnd ?? rangeStart)
    )
  })

  const dataChart = (preds: { [fecha: string]: number }, campo: 'tmed' | 'prec' | 'velmedia' | undefined) =>
    datosFiltrados.map(d => {
      const valor = parseFloat(d[campo].replace(',', '.'))
      let real: number
  
      if (campo === 'tmed') {
        real = valor * (37.2 - (-15.2)) + (-15.2)
      } else if (campo === 'prec') {
        const precMin = 0
        const precMax = 270.2
        real = valor * (precMax - precMin) + precMin
      } else if (campo === 'velmedia') {
        const velMin = 0
        const velMax = 24.2
        real = valor * (velMax - velMin) + velMin
      } else {
        real = valor
      }
      let pred = preds[d.fecha]
      if (campo === 'tmed') {
        pred = pred * (37.2 - (-15.2)) + (-15.2)
      } else if (campo === 'prec') {
        const precMin = 0
        const precMax = 270.2
        pred = pred * (precMax - precMin) + precMin
      } else if (campo === 'velmedia') {
        const velMin = 0
        const velMax = 24.2
        pred = pred * (velMax - velMin) + velMin
      } else {
        pred = pred
      }
  
      return {
        fecha: d.fecha,
        real,
        pred
      }
    })

  const grafica = (data: any[], label: string) => (
    <div style={{
      display: 'flex',
      gap: '20px',
      backgroundColor: 'white',
      borderRadius: '16px',
      border: '2px solid gray',
      width: '100%',
      height: '250px',
      marginBottom: '20px',
      marginTop: '20px',
      padding: '10px'
    }}>
      <div style={{ flexBasis: '80%', height: '100%' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#ff7300' }}>{label}</h3>
        {data.length === 0 ? (
          <p style={{ color: 'gray' }}>⚠️ No hay datos para este mes/año</p>
        ) : (
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={data}>
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="real" stroke="#ff7300" name="Real" />
              <Line type="monotone" dataKey="pred" stroke="#999" name="Predicción" dot={false} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div style={{
        flexBasis: '20%',
        borderLeft: '1px solid #ccc',
        paddingLeft: '10px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        fontSize: '14px'
      }}>
        {(() => {
          const errores = data.filter(d => d.pred !== null).map(d => Math.abs(d.real - d.pred))
          if (errores.length === 0) return <p style={{ color: 'gray' }}>Sin predicciones</p>
          const mae = errores.reduce((s, e) => s + e, 0) / errores.length
          const max = Math.max(...errores)
          const med = errores.sort((a, b) => a - b)[Math.floor(errores.length / 2)]
          return (
            <>
              <p><strong>MAE:</strong> {mae.toFixed(2)} {label.includes('Precipitación') ? 'mm' : label.includes('Viento') ? 'm/s' : 'ºC'}</p>
              <p><strong>Error máx:</strong> {max.toFixed(2)} {label.includes('Precipitación') ? 'mm' : label.includes('Viento') ? 'm/s' : 'ºC'}</p>
              <p><strong>Mediana:</strong> {med.toFixed(2)} {label.includes('Precipitación') ? 'mm' : label.includes('Viento') ? 'm/s' : 'ºC'}</p>
            </>
          )
        })()}
      </div>
    </div>
  )

  return (
    <div className="container">
      <div className="header">Estación: {id}</div>

      <button onClick={() => router.push('/simulador')} className="backButton">
        ← Volver a la lista
      </button>

      <div className="mainContent">
        <div className="yearSelector">
          <label>Selecciona un año:</label>
          <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
            {Array.from({ length: 2023 - 1995 + 1 }, (_, i) => 1995 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <div className="monthGrid">
            {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
              .map((m, i) => (
                <div key={i} onClick={() => handleMonthClick(i)} className={`month ${isMonthSelected(i) ? 'selected' : ''}`}>
                  {m}
                </div>
              ))}
          </div>
        </div>

        <div className="mapContainer">
          {estacion && <Mapa estaciones={[{
            nombre: estacion.nombre,
            indicativo: estacion.indicativo,
            latitud: parseFloat(estacion.latitud),
            longitud: parseFloat(estacion.longitud)
          }]} />}
        </div>
      </div>
      {grafica(dataChart(pred1, 'tmed'), 'Predicción a 1 día')}
      {grafica(dataChart(pred3, 'tmed'), 'Predicción a 3 días')}
      {grafica(dataChart(precPred, 'prec'), 'Predicción de Precipitación a 1 dia')}
      {grafica(dataChart(precPred3, 'prec'), 'Predicción de Precipitación a 3 dias')}
      {grafica(dataChart(windPred, 'velmedia'), 'Predicción de Viento a 1 dia')}
      {grafica(dataChart(windPred3, 'velmedia'), 'Predicción de Viento a 3 dias')}
    </div>
  )
}
