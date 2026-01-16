import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/firebase";

export const logOrderEvent = async ({
  orderId,
  type,
  from = null,
  to = null,
  actor = "admin",
  actorName = "Admin",
  meta = {},
}) => {
  await addDoc(collection(db, "order_events"), {
    orderId,
    type,
    from,
    to,
    actor,
    actorName,
    meta,
    timestamp: serverTimestamp(),
  });
};
