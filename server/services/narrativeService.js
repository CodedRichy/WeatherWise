const TEMP_PHRASES = {
  freezing: ['bitterly cold', 'freezing conditions', 'well below zero'],
  cold: ['cold day', 'chilly weather', 'bundle up weather'],
  cool: ['cool and refreshing', 'pleasantly cool', 'crisp conditions'],
  mild: ['mild conditions', 'comfortable temperature', 'lovely weather'],
  warm: ['warm day', 'pleasantly warm', 'warm and sunny'],
  hot: ['hot day', 'sweltering heat', 'very hot conditions'],
  scorching: ['dangerously hot', 'extreme heat', 'heat advisory conditions'],
}

const HUMIDITY_PHRASES = {
  dry: ['with low humidity', 'and dry air', 'feeling dry'],
  comfortable: ['with comfortable humidity', 'feeling pleasant', 'with good air quality'],
  humid: ['with humid conditions', 'feeling muggy', 'with high moisture'],
  oppressive: ['with oppressive humidity', 'feeling very muggy', 'uncomfortably humid'],
}

const WIND_PHRASES = {
  calm: ['calm winds', 'still air', 'no wind to speak of'],
  breezy: ['a gentle breeze', 'light winds', 'a refreshing breeze'],
  windy: ['strong winds', 'quite windy', 'gusty conditions'],
  strong: ['dangerous wind gusts', 'severe winds', 'storm-force winds'],
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getTempBucket(temp) {
  if (temp < 0) return 'freezing'
  if (temp < 10) return 'cold'
  if (temp < 18) return 'cool'
  if (temp < 24) return 'mild'
  if (temp < 30) return 'warm'
  if (temp < 38) return 'hot'
  return 'scorching'
}

function getHumidityBucket(humidity) {
  if (humidity < 30) return 'dry'
  if (humidity < 60) return 'comfortable'
  if (humidity < 80) return 'humid'
  return 'oppressive'
}

function getWindBucket(windSpeed) {
  if (windSpeed < 3) return 'calm'
  if (windSpeed < 8) return 'breezy'
  if (windSpeed < 15) return 'windy'
  return 'strong'
}

function getPrecipPhrase(condition) {
  if (/Rain|Drizzle|Showers|Thunderstorm/.test(condition)) return 'high chance of precipitation'
  if (/Snow/.test(condition)) return 'snow expected'
  if (/Clear|Partly Cloudy/.test(condition)) return 'dry conditions'
  return 'some precipitation possible'
}

function getClosingLine(tempBucket, tone) {
  if (tone === 'formal') return 'Outdoor activities should be planned accordingly.'
  const goodBuckets = ['mild', 'warm', 'cool']
  return goodBuckets.includes(tempBucket)
    ? 'Perfect weather for outdoor activities!'
    : 'Plan your day accordingly!'
}

export function generateNarrative(weatherData, tone = 'casual') {
  const { temperature, humidity, windSpeed, condition } = weatherData

  const tempBucket = getTempBucket(temperature)
  const humBucket = getHumidityBucket(humidity)
  const windBucket = getWindBucket(windSpeed)

  const tempPhrase = pick(TEMP_PHRASES[tempBucket])
  const humPhrase = pick(HUMIDITY_PHRASES[humBucket])
  const windPhrase = pick(WIND_PHRASES[windBucket])
  const precipPhrase = getPrecipPhrase(condition || 'Unknown')
  const closing = getClosingLine(tempBucket, tone)

  let narrative
  if (tone === 'formal') {
    const windCap = windPhrase.charAt(0).toUpperCase() + windPhrase.slice(1)
    narrative =
      `Current conditions indicate a ${tempPhrase} ${humPhrase}. ` +
      `${windCap} are present, and ${precipPhrase} is expected. ` +
      `${closing}`
  } else {
    narrative =
      `It's a ${tempPhrase} out there, ${humPhrase}. ` +
      `Expect ${windPhrase} and ${precipPhrase}. ` +
      `${closing}`
  }

  return { narrative, tone, generatedAt: new Date().toISOString() }
}
