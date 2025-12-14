import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCurrency, formatCompact } from '../../utils/formatters';
import { chartColorsArray } from '../../utils/colors';

interface BarChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface CustomBarChartProps {
  data: BarChartData[];
  height?: number;
  valueKey?: string;
  nameKey?: string;
  horizontal?: boolean;
  formatValue?: (value: number) => string;
  showGrid?: boolean;
  colorful?: boolean;
  barColor?: string;
}

export function CustomBarChart({
  data,
  height = 300,
  valueKey = 'value',
  nameKey = 'name',
  horizontal = false,
  formatValue = formatCompact,
  showGrid = true,
  colorful = true,
  barColor = '#6366f1',
}: CustomBarChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="text-sm font-medium text-white mb-1">{label}</p>
          <p className="text-sm text-primary-400">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />}
          <XAxis
            type="number"
            tickFormatter={formatValue}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#334155' }}
          />
          <YAxis
            type="category"
            dataKey={nameKey}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#334155' }}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={valueKey} radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colorful ? chartColorsArray[index % chartColorsArray.length] : barColor}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />}
        <XAxis
          dataKey={nameKey}
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          axisLine={{ stroke: '#334155' }}
          tickLine={{ stroke: '#334155' }}
        />
        <YAxis
          tickFormatter={formatValue}
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          axisLine={{ stroke: '#334155' }}
          tickLine={{ stroke: '#334155' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey={valueKey} radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colorful ? chartColorsArray[index % chartColorsArray.length] : barColor}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
