const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.archiveCompletedOrders = functions.pubsub
  .schedule("every 60 minutes")
  .onRun(async () => {
    const db = admin.firestore();

    const limitDate = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    );

    const snapshot = await db
      .collection("orders")
      .where("status", "==", "completed")
      .where("archived", "==", false)
      .where("completedAt", "<=", limitDate)
      .get();

    if (snapshot.empty) return null;

    const batch = db.batch();

    snapshot.forEach((doc) => {
      batch.update(doc.ref, { archived: true });
    });

    await batch.commit();
    return null;
  });
