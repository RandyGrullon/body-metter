import type { CatalogExercise } from "@/types/gym";
import catalogJson from "@/lib/data/exercise-catalog.json";

const list = catalogJson as CatalogExercise[];

const byId = new Map(list.map((e) => [e.id, e]));

export function getCatalogExercises(): CatalogExercise[] {
  return list;
}

export function getCatalogExerciseById(id: string): CatalogExercise | undefined {
  return byId.get(id);
}

export function searchCatalogExercises(params: {
  query: string;
  muscle?: string;
  equipment?: string;
}): CatalogExercise[] {
  const q = params.query.trim().toLowerCase();
  const muscle = params.muscle?.trim().toLowerCase();
  const equipment = params.equipment?.trim().toLowerCase();
  return list.filter((e) => {
    const matchQ =
      !q ||
      e.nameEs.toLowerCase().includes(q) ||
      e.muscleGroups.some((m) => m.toLowerCase().includes(q));
    const matchM =
      !muscle ||
      e.muscleGroups.some((m) => m.toLowerCase().includes(muscle));
    const matchE =
      !equipment || e.equipment.toLowerCase().includes(equipment);
    return matchQ && matchM && matchE;
  });
}
