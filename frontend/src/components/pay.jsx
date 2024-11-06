import React, { useRef, useState } from 'react'; // useRef와 useState를 React에서 임포트
import { Line } from 'react-chartjs-2'; // Line 차트 임포트
import 'chart.js/auto'; // Chart.js 자동 설치
import 'chartjs-plugin-zoom'; // 차트 줌 플러그인
import { saveAs } from 'file-saver'; // saveAs 함수 임포트
import * as XLSX from 'xlsx'; // XLSX 임포트
import { FaBars } from 'react-icons/fa'; // FaBars 아이콘 임포트
import DatePicker from 'react-datepicker'; // DatePicker 컴포넌트 임포트
import 'react-datepicker/dist/react-datepicker.css'; // DatePicker 스타일
// import '../css/pay.css'; // CSS 파일 임포트




const CustomLineChart = () => {
  const chartRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState('year');
  const [startDate, setStartDate] = useState(new Date('2023-01-01'));
  const [endDate, setEndDate] = useState(new Date()); // 끝 날짜를 현재 날짜로 설정

  // month에서 6개월 전, year에서 연도별, week에서 7일 전까지 선택 가능하도록 제한 설정
  const minDateForMonth = new Date(endDate);
  minDateForMonth.setMonth(minDateForMonth.getMonth() - 6); // 6개월 전

  const minDateForYear = new Date('2000-01-01'); // 연도는 2000년부터
  const minDateForWeek = new Date(endDate);
  minDateForWeek.setDate(minDateForWeek.getDate() - 7); // 7일 전

  const filterDataByDate = (start, end) => {
    let filteredData;

    setChartData({
      labels: filteredData.labels,
      datasets: [{
        label: 'GPU 사용량',
        data: filteredData.values,
        backgroundColor: 'rgba(0, 0, 255, 0.2)',
        borderColor: '#00ffff',
        borderWidth: 2,
        pointBackgroundColor: '#00ffff',
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true
      }]
    });
  };

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{
      label: 'GPU 사용량',
      data: [],
      backgroundColor: 'rgba(0, 0, 255, 0.2)',
      borderColor: '#00ffff',
      borderWidth: 2,
      pointBackgroundColor: '#00ffff',
      pointRadius: 5,
      pointHoverRadius: 7,
      fill: true
    }]
  });

  const updateChart = (period) => {
    setCurrentPeriod(period);

    if (period === 'week') {
      const newStartDate = new Date(endDate);
      newStartDate.setDate(newStartDate.getDate() - 7); // 7일 전 날짜 계산
      setStartDate(newStartDate);
      filterDataByDate(newStartDate, endDate);
    } else if (period === 'month') {
      filterDataByDate(startDate, endDate);
    } else {
      filterDataByDate(startDate, endDate);
    }
  };

  const downloadImage = () => {
    const chart = chartRef.current;
    const base64Image = chart.toBase64Image();
    saveAs(base64Image, 'chart.png');
  };

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      chartData.labels.map((label, index) => ({
        Date: label,
        Value: chartData.datasets[0].data[index]
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'chart_data.xlsx');
  };

  return (
    <div className="chart-wrapper">
      {/* 날짜 선택기 및 메뉴 아이콘 */}
      <div className="date-picker-container">
        <label>Start Date: </label>
        <DatePicker
          selected={startDate}
          onChange={(date) => {
            setStartDate(date);
            filterDataByDate(date, endDate);
          }}
          minDate={currentPeriod === 'month' ? minDateForMonth : currentPeriod === 'year' ? minDateForYear : minDateForWeek} // 기간에 맞는 minDate 설정
          maxDate={endDate}
          showMonthYearPicker={currentPeriod === 'month'} // 월간 모드일 때만 월별 선택
          showYearPicker={currentPeriod === 'year'} // 연간 모드일 때는 연도 선택
          showWeekNumbers={currentPeriod === 'week'} // 주간 모드일 때 주별 선택 가능
        />
        <label>End Date: </label>
        <DatePicker
          selected={endDate}
          onChange={(date) => {
            setEndDate(date);
            filterDataByDate(startDate, date);
          }}
          maxDate={new Date()}
        />
        {/* 메뉴 아이콘 */}
        <div className="menu-icon-container">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="menu-icon">
            <FaBars size={24} color="#fff" />
          </button>
          {isMenuOpen && (
            <div className="menu-dropdown">
              <ul>
                <li onClick={downloadImage}>Download Image</li>
                <li onClick={downloadExcel}>Download Excel</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Year, Month, Week 버튼을 차트 아래에 배치 */}
      <div className="chart-controls">
        <button onClick={() => updateChart('year')}>Year</button>
        <button onClick={() => updateChart('month')}>Month</button>
        <button onClick={() => updateChart('week')}>Week</button>
      </div>
      {/* 라인 차트 */}
      <div className="chart-container">
        <Line
          ref={chartRef}
          data={chartData}
          options={{
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  color: '#fff',
                  font: { size: 14 },
                  stepSize: 40,
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.2)', // y축 그리드 선의 색상 설정
                  lineWidth: 1, // y축 그리드 선의 두께 설정
                },

              },
            },
            plugins: {
              legend: {
                labels: { color: '#fff' },
              },
              tooltip: {
                enabled: true,
                callbacks: {
                  label: (tooltipItem) => `Value: ${tooltipItem.raw}`,
                },
              },
              zoom: {
                zoom: {
                  wheel: { enabled: true },
                  pinch: { enabled: true },
                  mode: 'x',
                },
                pan: { enabled: true, mode: 'x' },
              },
            },
          }}
        />

        {/* 오른쪽 표 차트 */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {chartData.labels.map((label, index) => (
                <tr key={index}>
                  <td>{label}</td>
                  <td>{chartData.datasets[0].data[index]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomLineChart;