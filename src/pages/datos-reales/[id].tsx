import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import dynamic from 'next/dynamic'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const Mapa = dynamic(() => import('@/components/Mapa'), { ssr: false })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DetalleEstacion() {
  const router = useRouter()
  const { id } = router.query
  const [nombre, setNombre] = useState('')
  const [datos, setDatos] = useState<any[]>([])
  const [lat, setLat] = useState<number | null>(null)
  const [lon, setLon] = useState<number | null>(null)
  const [fecha, setFecha] = useState<Date>(new Date())
  const [resumenPorFecha, setResumenPorFecha] = useState<any>({})
  const [datosSeleccionados, setDatosSeleccionados] = useState<any[]>([])

  useEffect(() => {
    if (!id) return

    const fetchNombre = async () => {
      const { data } = await supabase
        .from('TTDISPOSITIVOS')
        .select('device_id, LAT, LON')
        .eq('device_id', id)
        .single()

      if (data) {
        setNombre(data.device_id)
        setLat(data.LAT)
        setLon(data.LON)
      }
    }

    const fetchDatos = async () => {
      const { data } = await supabase
        .from('TDATOSREALES')
        .select('*')
        .eq('device_id', id)
        .order('timestamp', { ascending: true })

      if (data) {
        setDatos(data)

        const resumen: any = {}
        data.forEach((registro, index) => {
          if (registro.humidity == 409.7) {
            if (index != 0)
              registro.humidity = data[index - 1].humidity
            else
              registro.humidity = data[index + 1].humidity
          }
          const date = new Date(registro.timestamp).toISOString().split('T')[0]
          if (!resumen[date]) {
            resumen[date] = {
              count: 0,
            }
          }
          resumen[date].count += 1
        })
        setResumenPorFecha(resumen)
      }
    }

    fetchNombre()
    fetchDatos()
  }, [id])

  const tileContent = ({ date, view }: any) => {
    const localDate = new Date(date)
    const dateString = `${localDate.getFullYear()}-${(localDate.getMonth() + 1).toString().padStart(2, '0')}-${localDate.getDate().toString().padStart(2, '0')}`
    const resumen = resumenPorFecha[dateString]

    if (resumen) {
      return (
        <div style={{ padding: '5px', fontSize: '0.8rem', color: 'black' }}>
          <div>Registros: {resumen.count}</div>
        </div>
      )
    }
    return null
  }

  const handleFechaSeleccionada = (date: Date) => {
    console.log(date)
    setFecha(date)
    const localDate = new Date(date)
    const dateString = `${localDate.getFullYear()}-${(localDate.getMonth() + 1).toString().padStart(2, '0')}-${localDate.getDate().toString().padStart(2, '0')}`

    const datosDelDia = datos.filter((registro) => {
      const registroDate = new Date(registro.timestamp).toISOString().split('T')[0]
      return registroDate === dateString
    })
    setDatosSeleccionados(datosDelDia)
  }

  return (
    <div style={{ padding: '2rem', width: '100%' }}>
      <div style={{
        backgroundColor: 'white',
        border: '2px solid #333',
        borderRadius: '1rem',
        padding: '1rem 2rem',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        width: '100%'
      }}>
        Estación: {nombre}
      </div>

      <button
        onClick={() => router.push('/datos-reales')}
        style={{
          backgroundColor: '#489eff',
          color: 'white',
          padding: '0.5rem 1rem',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '1rem',
          cursor: 'pointer',
        }}
      >
        ← Volver a la lista
      </button>

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div style={{ width: '70%', height: '600px' }}>
          <Calendar
            onChange={handleFechaSeleccionada}
  value={fecha}
  minDetail="month"
  maxDetail="month"
  tileContent={tileContent}
  firstDayOfWeek={0} // Asegura que la semana comience el domingo
  showNeighboringMonth={true}
          />
        </div>

        <div
          style={{
            flexBasis: '30%',
            background: 'white',
            border: '2px solid gray',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '2px 2px 8px rgba(0, 0, 0, 0.1)',
            minHeight: '600px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}
        >
          {lat && lon && (
            <div style={{ flex: 1, width: '100%', height: '600px' }}>
              <Mapa estaciones={[{
                nombre: nombre,
                indicativo: "",
                latitud: lat,
                longitud: lon
              }]} base={'datos-reales'} />
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexBasis: '100%',
          flexDirection: 'row',
          gap: '10px',
        }}>
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            border: '2px solid gray',
            width: '50%',
            height: '300px',
            marginTop: '20px',
            display: 'flex',
            flexDirection: 'row',
            overflow: 'hidden',
            padding: '10px',
            gap: '1rem'
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              paddingRight: '10px'
            }}
          >
            {datosSeleccionados.length > 0 ? (
              datosSeleccionados.map((registro, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>Hora: {registro.timestamp.split('T')[1].split('.')[0]}</span>
                  <span>Temp: {registro.temperature}°C</span>
                  <span>Hum: {registro.humidity} %</span>
                </div>
              ))
            ) : (
              <div>No hay datos para este día.</div>
            )}
          </div>
        </div>
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            border: '2px solid gray',
            width: '50%',
            height: '300px',
            marginTop: '20px',
            display: 'flex',
            flexDirection: 'row',
            overflow: 'hidden',
            padding: '10px',
            gap: '1rem'
          }}
        >
          <div
            style={{
              flex: 1.5,
              height: '100%',
              minWidth: '0'
            }}
          >
            {datosSeleccionados.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={datosSeleccionados.map(d => ({
                    hora: d.timestamp.split('T')[1].split('.')[0],
                    temperatura: d.temperature,
                    humedad: d.humidity
                  }))}
                >
                  <XAxis dataKey="hora" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="temperatura" stroke="#ff7300" />
                  <Line type="monotone" dataKey="humedad" stroke="#387908" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
