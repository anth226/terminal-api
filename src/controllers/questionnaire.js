import { db, admin } from "../services/firebase";

export const questionnaireSubmission = async (req, res) => {
  const { body, terminal_app } = req
  const { profesional_questions, city } = body

  const data = await db.collection("users").doc(terminal_app.claims.uid).get();

  let updateData = {}
  if (profesional_questions) {
    updateData = { profesional_questions, feed_access: { isIndiceAccess: true } }
    if (profesional_questions.Q1.toLowerCase() === "no" && profesional_questions.Q2.toLowerCase() === "no" && profesional_questions.Q3.toLowerCase() === "no" && profesional_questions.Q4.toLowerCase() === "no") {
      updateData = { ...updateData, isProfesional: false }
    } else {
      updateData = { ...updateData, isProfesional: true }
    }

    if (city && city.length > 0) {
      updateData = { ...updateData, city: city }
    }

    if (data.data() && data.data().isPrime && data.data().isPrime === true) {
      updateData = { ...updateData, feed_access: { ...updateData.feed_access, isRealtimeNasdaqAccess: "YES" } }
    } else {
      updateData = { ...updateData, feed_access: { ...updateData.feed_access, isRealtimeNasdaqAccess: "REQUESTED" } }
    }
  }

  const userRef = db.collection("users").doc(terminal_app.claims.uid);
  await userRef.update(updateData);
  res.send({ success: true })
}