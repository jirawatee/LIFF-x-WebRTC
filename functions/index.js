const functions = require("firebase-functions");

exports.myCallable = functions.https.onCall(async (data, context) => {
  const base64 = data.base64.split(",")

  const vision = require('@google-cloud/vision')
  const client = new vision.ImageAnnotatorClient({ keyFilename: './service-account.json' })
  const request = { image: { content: base64[1] } }
  const [result] = await client.textDetection(request)
  const detections = result.fullTextAnnotation.text
  const datas = {}

  detections.split('\n').forEach((row) => {
    let items = row.split(' ')

    const thaiid = items.join('')
    if (isThaiNationalID(thaiid)) {
      datas.cardNumber = thaiid
    }

    if (row.includes('ชื่อตัวและชื่อสกุล')) {
      datas.prename = items[1]
      datas.firstname = items[2]
      datas.lastname = items[3]
    }

    if (row.includes('Date of Birth')) {
        datas.birthDate = `${items[3]} ${items[4]} ${items[5]}`
    }
  })
  if (datas.prename) {
    datas.gender = 'M'
    if (['น.ส.', 'นางสาว', 'นาง', 'เด็กหญิง'].includes(datas.prename)) {
      datas.gender = 'F'
    }
  }

  return {
    result: datas
  }
})

function isThaiNationalID(id) {
  if (!/^[0-9]{13}$/g.test(id)) {
    return false
  }
  let i; let sum = 0
  for ((i = 0), (sum = 0); i < 12; i++) {
    sum += Number.parseInt(id.charAt(i)) * (13 - i)
  }
  const checkSum = (11 - sum % 11) % 10
  if (checkSum === Number.parseInt(id.charAt(12))) {
    return true
  }
  return false
}