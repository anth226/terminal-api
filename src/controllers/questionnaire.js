import { db, admin } from "../services/firebase";

export const questionnaireSubmission = async (req, res) => {
  const { body, terminal_app } = req
  const { profesional_questions } = body

  const data = await db.collection("users").doc(terminal_app.claims.uid).get();

  if (profesional_questions) {
    let updateData = { profesional_questions, feed_access: { isIndiceAccess: true } }
    if (profesional_questions.Q1 === "NO" && profesional_questions.Q2 === "NO" && profesional_questions.Q3 === "NO" && profesional_questions.Q4 === "NO") {
      updateData = { ...updateData, isProfesional: false }
    } else {
      updateData = { ...updateData, isProfesional: true }
    }

    if (data.data() && data.data().isPrime && data.data().isPrime === true) {
      updateData = { ...updateData, feed_access: { ...updateData.feed_access, isRealtimeNasdaqAccess: "YES" } }
    } else {
      updateData = { ...updateData, feed_access: { ...updateData.feed_access, isRealtimeNasdaqAccess: "REQUESTED" } }
    }
  }

  const userRef = db.collection("users").doc('TtCJ7CkpZ5d6WATm5rckuBeG7A33');
  await userRef.update(JSON.parse(JSON.stringify(data)));
  res.send("Updated!")
}