import { 
  useEffect,
  useState,
  Fragment
} from 'react';

import { 
  Card,
  Row,
  Col,
  Slider,
  Button,
  List,
  TimePicker,
  Divider,
  Badge,
  message
} from 'antd';

import { 
  IoWater
} from 'react-icons/io5';

import { 
  BsUsbSymbol, 
  BsFillSunFill
} from 'react-icons/bs';

import { 
  CaretRightOutlined,
  CloseOutlined
} from '@ant-design/icons';

import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';

// CSS
import 'antd/dist/reset.css';
import './App.css';

function App() {
  const [messageApi, contextHolder] = message.useMessage();

  const [connected, setConnected] = useState<boolean>(false);
  const [devicePort] = useState<string>("/dev/ttyS0");
  const [currentHumidity, setCurrentHumidity] = useState<number>(0);
  const [humidityTrigger, setHumidityTrigger] = useState<number>(100);
  const [currentWeather, setCurrentWheater] = useState<any>();
  const [scheduleTime, setScheduleTime] = useState<Dayjs>();
  const [schedules, setSchedules] = useState<string[]>([]);
  const [saveSettingsLoading, setSaveSettingsLoading] = useState(false)

  const api = axios.create({
    baseURL: 'https://localhost:7137/',
  })

  useEffect(() => {
    const openMeteo = axios.create({
      baseURL: 'https://api.open-meteo.com/v1/',
    });

    const currentDate = dayjs().format('YYYY-MM-DD')
    
    openMeteo
      .get('forecast', { 
          params: { 
            latitude: -20.82,
            longitude: -49.38,
            daily: 'temperature_2m_max,temperature_2m_min',
            current_weather: true,
            forecast_days: 1,
            start_date: currentDate,
            end_date: currentDate,
            timezone: 'America/Sao_Paulo'
          } 
        }
      )
      .then(({ data }: { data: any }) => {
        setCurrentWheater(data)
      })
  }, []);

  useEffect(() => {
    if (connected && devicePort) {
      api.get('device/humidity', { params: { deviceId: devicePort } })
        .then(({ data }: { data: any }) => {
          setCurrentHumidity(data);
        }
      );
    }
  }, [devicePort]);

  const status = [
    {
      icon: <BsUsbSymbol size={20}/>,
      description: 'Conectado na porta ' + devicePort,
      status: connected ? <Badge status="success" /> : <Badge status='error' />
    },
    {
      icon: <IoWater size={20} color='#1677ff'/>,
      description: 'Umidade em ' + currentHumidity
    }
  ];

  const manualTrigger = () => {
    messageApi
      .open({
        type: 'loading',
        content: 'Aguando..',
        duration: 5,
      })
      .then(() => message.success('Aguado!', 2.5))
  }

  const onAddSchedule = () => {
    const formatedTime = dayjs(scheduleTime).format('HH:mm');

    if (schedules.some(x => x === formatedTime)) {
      messageApi.open({
        type: 'error',
        content: 'Horário já cadastrado',
      });

      return;
    }

    var sortedArray = [...schedules, formatedTime].sort((a,b) => a.localeCompare(b))
    setSchedules(sortedArray);

    messageApi.open({
      type: 'success',
      content: 'Horário adicionado com sucesso',
    });
  }

  const onRemoveSchedule = (item: any) => {
    if (schedules.some(x => x === item)) {
      setSchedules(schedules.filter(x => x !== item))

      messageApi.open({
        type: 'success',
        content: 'Horário removido com sucesso',
      });
    }
  }

  const connectDevice = () => {
    api.post('device/connect/', null, { params: {
      deviceId: devicePort
    }})
    .then(({ data }: { data: any }) => {
        setConnected(data);
      }
    );
  }

  const onSubmit = () => {
    if (!connected) {
      messageApi.open({
        type: 'error',
        content: 'Necessário conectar o dispositivo',
      });

      return;
    }

    setSaveSettingsLoading(true);

    api.post('settings', {
      HumidityTrigger: humidityTrigger,
      Schedules: schedules
    }, { params: { deviceId: devicePort } }).then(() => {
      setSaveSettingsLoading(false);

      messageApi.open({
        type: 'success',
        content: 'Configuração salva com sucesso',
      });
    });
  }

  return (
    <Fragment>
      {contextHolder}
      <div className="App">
        <Row>
          <Col span={8}>
            <Card title="Temperatura atual">
              {currentWeather && <div>
                <Row>
                  <BsFillSunFill size={60} color='#fba209' style={{ marginLeft: '40%' }} />
                </Row>
                <Row style={{ marginTop: '15px' }}>
                  Está fazendo { currentWeather.current_weather.temperature }°C em São José do Rio Preto
                </Row>
              </div>}
            </Card>

            <Card title="Status" style={{ marginTop: '20px' }}>
              {!connected && <Fragment>
                <Button 
                  type="primary" 
                  icon={<BsUsbSymbol style={{ marginRight: '6px', marginTop: '1px' }}/>}
                  danger
                  style={{ marginTop: '20px', width: '100%' }}
                  onClick={connectDevice}
                >
                  Conectar dispositivo ({ devicePort })
                </Button>
              </Fragment>}
              {connected && <Fragment>
                <List
                  size="small"
                  bordered
                  dataSource={status}
                  renderItem={(item) => 
                    <List.Item style={{ textAlign: 'left'}}>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        {item.icon} <span style={{ paddingLeft: '5px' }}>{item.description} {item.status}</span>
                      </span>
                    </List.Item>
                  }
                />
              
                <Button 
                  type="primary" 
                  icon={<CaretRightOutlined />}
                  danger
                  style={{ marginTop: '20px', width: '100%' }}
                  onClick={manualTrigger}
                >
                  Irrigar manualmente
                </Button>
              </Fragment>}
            </Card>
          </Col>
          <Col span={15} offset={1}>
            <Card title="Ativar quando umidade chegar em">
              <div style={{ paddingTop: '15px' }}>
                <Slider 
                  value={humidityTrigger}
                  tooltip={{ open: true }}
                  min={100}
                  max={1000}
                  step={100}
                  onChange={(value) => setHumidityTrigger(value)}
                />
              </div>
            </Card>

            <Card title="Horários de execução" style={{ marginTop: '20px' }}>
              <div style={{ paddingTop: '15px' }}>
                <TimePicker
                  format={'HH:mm'}
                  placeholder='Selecione um horário'
                  value={scheduleTime}
                  style={{ width: '200px' }}
                  onSelect={(time) => {
                    setScheduleTime(time)
                  }}
                />
                <Button type="primary" onClick={onAddSchedule} style={{ marginLeft: '10px' }}>
                  Adicionar
                </Button>

                <Divider />

                <List
                  size="small"
                  bordered
                  dataSource={schedules}
                  locale={{ emptyText: 'Nenhum horário cadastrado' }}
                  renderItem={(item) => 
                    <List.Item actions={[<Button type="primary" danger icon={<CloseOutlined />} onClick={() => onRemoveSchedule(item)} />]}>
                      {item}
                    </List.Item>
                  }
                />
              </div>
            </Card>

            <Button type="primary" onClick={onSubmit} style={{ marginTop: '20px', width: '100%' }} loading={saveSettingsLoading}>
              Salvar configurações
            </Button>
          </Col>
        </Row>
      </div>
    </Fragment>
  );
}

export default App;