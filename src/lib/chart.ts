import * as echarts from 'echarts'

let chart :any;

const makeLogChart = (div:string) => {
  chart = echarts.init(document.getElementById(div),"dark");
  const option = {
    title: {
      show: false,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '5%',
      right: '10%',
      top: 40,
      buttom: 0,
    },
    xAxis: {
      type: 'time',
      name: "日時",
      axisLabel: {
        color: '#ccc',
        fontSize: '8px',
        formatter: (value:any, index:any) => {
          const date = new Date(value)
          return echarts.time.format(date, '{MM}/{dd} {HH}:{mm}',false)
        },
      },
      nameTextStyle: {
        color: '#ccc',
        fontSize: 8,
        margin: 2,
      },
      axisLine: {
        lineStyle: {
          color: '#ccc',
        },
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      name: "件数",
      nameTextStyle: {
        color: '#ccc',
        fontSize: 8,
        margin: 2,
      },
      axisLine: {
        lineStyle: {
          color: '#ccc',
        },
      },
      axisLabel: {
        color: '#ccc',
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
    legend: {
      textStyle: {
        fontSize: 8,
        color: '#ccc',
      },
      data: ["重度","軽度","注意","その他"],
    },
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
  chart = echarts.init(document.getElementById(div),"dark");
  const option = {
    title: {
      show: false,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
    },
    yAxis: {
      type: 'category',
      data: ['']
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
    legend: {
      textStyle: {
        fontSize: 8,
        color: '#ccc',
      },
      data: ["重度","軽度","注意","正常","復帰","その他"],
    },
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
    reair: 0,
    other: 0,
  }
  list.forEach((e:any) => {
    const s = count[e.State] != undefined ? e.State : 'other';
    count[s]++;
  })
  chart.setOption({
    series: [
      {
        data: [count.high],
      },
      {
        data: [count.low],
      },
      {
        data: [count.warn],
      },
      {
        data: [count.normal],
      },
      {
        data: [count.reair],
      },
      {
        data: [count.other],
      },
    ],
  });
  chart.resize();
}

const makeAIChart = (div:string) => {
  chart = echarts.init(document.getElementById(div),"dark");
  const option = {
    title: {
      show: false,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
    },
    yAxis: {
      type: 'category',
      data: ['']
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
    legend: {
      textStyle: {
        fontSize: 8,
        color: '#ccc',
      },
      data: ["重度","軽度","注意","正常"],
    },
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
    const s = "normal";
    if(e.Score > 66 ) {
      count.high++;
    } else if (e.Score > 58 ) {
      count.low++;
    } else if (e.Score > 50) {
      count.warn++;
    } else {
      count.normal++;
    }
    count[s]++;
  })
  chart.setOption({
    series: [
      {
        data: [count.high],
      },
      {
        data: [count.low],
      },
      {
        data: [count.warn],
      },
      {
        data: [count.normal],
      },
    ],
  });
  chart.resize();
}


export const resizeChart = () => {
  if (chart) {
    chart.resize();
  }
}

