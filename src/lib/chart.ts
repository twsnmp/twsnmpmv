import * as echarts from 'echarts'

let chart :any;

const makeLogChart = (div:string) => {
  chart = echarts.init(document.getElementById(div),isDark() ? "dark" : "");
  const option = {
    title: {
      show: false,
    },
    grid: {
      left: 20,
      right: 10,
      top: 20,
      bottom: 20,
    },
    xAxis: {
      type: 'time',
      axisLabel: {
        color: isDark() ? '#ccc' : '#333',
        fontSize: '6px',
        rotate: 10,
        formatter: (value:any, index:any) => {
          const date = new Date(value)
          return echarts.time.format(date, '{MM}/{dd} {HH}:{mm}',false)
        },
      },
      axisLine: {
        lineStyle: {
          color: isDark() ? '#ccc' : '#333',
        },
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: isDark() ? '#ccc' : '#333',
        },
      },
      axisLabel: {
        color: isDark() ? '#ccc' : '#333',
        fontSize: 8,
        margin: 2,
      },
    },
    series: [
      {
        name: "重度",
        type: 'bar',
        color: '#e31a1c',
        stack: 'count',
        large: true,
        data: [],
      },
      {
        name: "軽度",
        type: 'bar',
        color: '#fb9a99',
        stack: 'count',
        large: true,
        data: [],
      },
      {
        name: "注意",
        type: 'bar',
        color: '#dfdf22',
        stack: 'count',
        large: true,
        data: [],
      },
      {
        name: "その他",
        type: 'bar',
        color: '#1f78b4',
        stack: 'count',
        large: true,
        data: [],
      },
    ],
  }
  chart.setOption(option);
  chart.resize();
}

const addChartData = (data:any, count:number[], ctm:number, newCtm:number) => {
  let t = new Date(ctm * 60 * 1000)
  for (const k in count) {
    data[k].push({
      name: echarts.time.format(t, '{yyyy}/{MM}/{dd} {HH}:{mm}:{ss}',false),
      value: [t, count[k]],
    })
  }
  ctm++
  for (; ctm < newCtm; ctm++) {
    t = new Date(ctm * 60 * 1000)
    for (const k in count) {
      data[k].push({
        name: echarts.time.format(t, '{yyyy}/{MM}/{dd} {HH}:{mm}:{ss}',false),
        value: [t, 0],
      })
    }
  }
  return ctm
}

export const showLogChart = (div:string, logs:any) => {
  if (chart) {
    chart.dispose();
  }
  makeLogChart(div)
  const data:any = {
    high: [],
    low: [],
    warn: [],
    other: [],
  }
  const count :any = {
    high: 0,
    low: 0,
    warn: 0,
    other: 0,
  }
  let ctm : number = -1;
  let st = Infinity
  let lt = 0
  logs.forEach((e:any) => {
    const lvl = data[e.Level] ? e.Level : 'other'
    const newCtm = Math.floor(e.Time / (1000 * 1000 * 1000 * 60))
    if (ctm < 0) {
      ctm = newCtm;
    }
    if (ctm !== newCtm) {
      ctm = addChartData(data, count, ctm, newCtm);
      for (const k in count) {
        count[k] = 0;
      }
    }
    count[lvl]++;
    if (st > e.Time) {
      st = e.Time;
    }
    if (lt < e.Time) {
      lt = e.Time;
    }
  })
  addChartData(data, count, ctm, ctm + 1);
  chart.setOption({
    series: [
      {
        data: data.high,
      },
      {
        data: data.low,
      },
      {
        data: data.warn,
      },
      {
        data: data.other,
      },
    ],
  });
  chart.resize();
}

const makeStateChart = (div:string) => {
  chart = echarts.init(document.getElementById(div),isDark() ? "dark" : "");
  const option = {
    title: {
      show: false,
    },
    grid: {
      left: 10,
      right: 10,
      top: 0,
      bottom: 0,
    },
    xAxis: {
      type: 'value',
      show: false,
    },
    yAxis: {
      type: 'category',
      show: false,
      data: ['']
    },
    series: [
      {
        name: "重度",
        type: 'bar',
        color: '#e31a1c',
        stack: 'count',
        data: [],
      },
      {
        name: "軽度",
        type: 'bar',
        color: '#fb9a99',
        stack: 'count',
        data: [],
      },
      {
        name: "注意",
        type: 'bar',
        color: '#dfdf22',
        stack: 'count',
        data: [],
      },
      {
        name: "正常",
        type: 'bar',
        color: "#33a02c",
        stack: 'count',
        data: [],
      },
      {
        name: "復帰",
        type: 'bar',
        color: '#1f78b4',
        stack: 'count',
        data: [],
      },
      {
        name: "その他",
        type: 'bar',
        color: 'gray',
        stack: 'count',
        data: [],
      },
    ],
  }
  chart.setOption(option);
  chart.resize();
}


export const showStateChart = (div:string, list:any) => {
  if (chart) {
    chart.dispose();
  }
  makeStateChart(div)
  const count :any = {
    high: 0,
    low: 0,
    warn: 0,
    normal: 0,
    repair: 0,
    other: 0,
  }
  list.forEach((e:any) => {
    const s = count[e.State] != undefined ? e.State : 'other';
    count[s]++;
  })
  chart.setOption({
    series: [
      {
        data: [list.length ? 100 * count.high/list.length : 0],
        label: {
          show: true,
          formatter: (params:any) => Math.round(params.value * 10) / 10 + '%'
        },
      },
      {
        data: [list.length ? 100 * count.low/list.length : 0],
        label: {
          show: true,
          formatter: (params:any) => Math.round(params.value * 10) / 10 + '%'
        },
      },
      {
        data: [list.length ? 100 * count.warn/list.length : 0],
        label: {
          show: true,
          formatter: (params:any) => Math.round(params.value * 10) / 10 + '%'
        },
      },
      {
        data: [list.length ? 100 * count.normal/list.length : 0],
        label: {
          show: true,
          formatter: (params:any) => Math.round(params.value * 10) / 10 + '%'
        },
      },
      {
        data: [list.length ? 100 * count.repair/list.length : 0],
        label: {
          show: true,
          formatter: (params:any) => Math.round(params.value * 10) / 10 + '%'
        },
      },
      {
        data: [list.length ? 100 * count.other/list.length : 0],
        label: {
          show: true,
          formatter: (params:any) => Math.round(params.value * 10) / 10 + '%'
        },
      },
    ],
  });
  chart.resize();
}

const makeAIChart = (div:string) => {
  chart = echarts.init(document.getElementById(div),isDark() ? "dark" : "");
  const option = {
    title: {
      show: false,
    },
    grid: {
      left: 10,
      right: 10,
      top: 0,
      bottom: 0,
    },
    xAxis: {
      type: 'value',
      show:false,
    },
    yAxis: {
      type: 'category',
      show: false,
      data: ['']
    },
    series: [
      {
        name: "重度",
        type: 'bar',
        color: '#e31a1c',
        stack: 'count',
        data: [],
      },
      {
        name: "軽度",
        type: 'bar',
        color: '#fb9a99',
        stack: 'count',
        data: [],
      },
      {
        name: "注意",
        type: 'bar',
        color: '#dfdf22',
        stack: 'count',
        data: [],
      },
      {
        name: "正常",
        type: 'bar',
        color: "#33a02c",
        stack: 'count',
        data: [],
      },
    ],
  }
  chart.setOption(option);
  chart.resize();
}

export const showAIChart = (div:string, list:any) => {
  if (chart) {
    chart.dispose();
  }
  makeAIChart(div)
  const count :any = {
    high: 0,
    low: 0,
    warn: 0,
    normal: 0,
  }
  list.forEach((e:any) => {
    if(e.Score > 66 ) {
      count.high++;
    } else if (e.Score > 58 ) {
      count.low++;
    } else if (e.Score > 50) {
      count.warn++;
    } else {
      count.normal++;
    }
  })
  chart.setOption({
    series: [
      {
        data: [list.length ? 100 * count.high/list.length : 0],
        label: {
          show: true,
          formatter: (params:any) => Math.round(params.value * 10) / 10 + '%'
        },
      },
      {
        data: [list.length ? 100 * count.low/list.length : 0],
        label: {
          show: true,
          formatter: (params:any) => Math.round(params.value * 10) / 10 + '%'
        },
      },
      {
        data: [list.length ? 100 * count.warn/list.length : 0],
        label: {
          show: true,
          formatter: (params:any) => Math.round(params.value * 10) / 10 + '%'
        },
      },
      {
        data: [list.length ? 100 * count.normal/list.length : 0],
        label: {
          show: true,
          formatter: (params:any) => Math.round(params.value * 10) / 10 + '%'
        },
      },
    ],
  });
  chart.resize();
}

export const showAIHeatMap = (div:string, scores:any) => {
  if (chart) {
    chart.dispose()
  }
  chart = echarts.init(document.getElementById(div),isDark() ? "dark" : "");
  const hours = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    '23',
  ]
  const option = {
    title: {
      show: false,
    },
    grid: {
      left: 20,
      right: 10,
      top: 10,
      bottom: 20,
    },
    xAxis: {
      type: 'category',
      axisLabel: {
        color: isDark() ? '#ccc' : '#333',
        fontSize: 8,
        margin: 2,
      },
      axisLine: {
        lineStyle: {
          color: isDark() ? '#ccc' : '#333',
        },
      },
      data: [] as any[],
    },
    yAxis: {
      type: 'category',
      axisLabel: {
        color: isDark() ? '#ccc' : '#333',
        fontSize: 8,
        margin: 2,
      },
      axisLine: {
        lineStyle: {
          color: isDark() ? '#ccc' : '#333',
        },
      },
      data: hours,
    },
    visualMap: {
      show:false,
      min: 40,
      max: 80,
      textStyle: {
        color: isDark() ? '#ccc' : '#333',
        fontSize: 8,
      },
      calculable: true,
      realtime: false,
      inRange: {
        color: [
          '#313695',
          '#4575b4',
          '#74add1',
          '#abd9e9',
          '#e0f3f8',
          '#ffffbf',
          '#fee090',
          '#fdae61',
          '#f46d43',
          '#d73027',
          '#a50026',
        ],
      },
    },
    series: [
      {
        name: 'Score',
        type: 'heatmap',
        data: [] as any[],
        emphasis: {
          itemStyle: {
            borderColor: isDark() ? '#ccc' : '#333',
            borderWidth: 1,
          },
        },
        progressive: 1000,
        animation: false,
      },
    ],
  }
  if (!scores) {
    chart.setOption(option)
    chart.resize()
    return
  }
  let nD = 0
  let x = -1
  scores.forEach((e:any) => {
    const t = new Date(e[0] * 1000)
    if (nD !== t.getDate()) {
      option.xAxis.data.push(echarts.time.format(t, '{MM}/{dd}',false))
      nD = t.getDate()
      x++
    }
    option.series[0].data.push([x, t.getHours(), e[1]])
  })
  chart.setOption(option);
  chart.resize();
  return chart;
}


export const resizeChart = () => {
  if (chart) {
    chart.resize();
  }
}

const isDark = (): boolean => {
  const e = document.querySelector("html");
  return e != null && e.classList.contains("dark");
};
