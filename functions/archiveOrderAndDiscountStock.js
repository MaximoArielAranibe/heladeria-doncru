import functions from "firebase-functions";
import admin from "firebase-admin";

admin.initializeApp();

export const onOrderArchived = functions.firestore
  .document("orders/{orderId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // 🛑 Solo si recién se archivó
    if (before.archived === true || after.archived !== true) {
      return null;
    }

    const { productWeight, gustos } = after;

    if (!productWeight || !Array.isArray(gustos)) {
      console.error("Pedido mal formado", {
        orderId: context.params.orderId,
      });
      return null;
    }

    const weightPerGusto =
      productWeight / gustos.length;

    const db = admin.firestore();
    const batch = db.batch();

    for (const gusto of gustos) {
      const gustoRef = db
        .collection("gustos")
        .doc(gusto.id);

      const snap = await gustoRef.get();

      if (!snap.exists) {
        throw new Error(
          `Gusto ${gusto.id} no existe`
        );
      }

      const currentWeight = snap.data().weight;

      // 🚨 VALIDACIÓN OBLIGATORIA
      if (currentWeight < weightPerGusto) {
        throw new Error(
          `Stock insuficiente para ${snap.data().name}`
        );
      }

      batch.update(gustoRef, {
        weight: admin.firestore.FieldValue.increment(
          -weightPerGusto
        ),
      });
    }

    await batch.commit();

    console.log(
      `Stock descontado para pedido ${context.params.orderId}`
    );

    return null;
  });
