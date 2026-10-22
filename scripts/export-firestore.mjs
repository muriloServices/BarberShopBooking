import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app = initializeApp({
  credential: applicationDefault(),
  projectId: "barbershopbooking-ff17d",
});

const db = getFirestore(app);

async function main() {
  const collections = await db.listCollections();
  const result = {};

  for (const collection of collections) {
    const snapshot = await collection.get();

    result[collection.id] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  console.log(JSON.stringify(result, null, 2));
}

main()
    .catch((error) => {
      console.error("Erro ao exportar:", error.message);
      process.exitCode = 1;
    })
    .finally(() => app.delete());
