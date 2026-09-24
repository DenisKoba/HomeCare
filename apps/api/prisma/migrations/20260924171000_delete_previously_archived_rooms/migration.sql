-- Room deletion used to be implemented as a soft delete. Now that the DELETE
-- endpoint permanently removes rooms, purge records hidden by the old behavior.
-- Related tasks, completions, and plan items are removed by foreign-key cascades.
DELETE FROM "Room"
WHERE "archived" = true;
