-- The whiteboard library arrives on the account's other devices as it changes (18 November 2026).
--
-- A device heard of another's library change only at its next sync: the minute's safety-net poll,
-- or opening the library. Notes, folders, files and note apps come over Realtime's database
-- changes, and a change to one of them starts a sync at once (Pane/Sync/SyncEngine.swift). The
-- library's rows go the same way: a device that adds, renames or removes an item nudges the others,
-- which pull it within a second, an open library (the Mac's popover, the iPhone's sheet) included.
-- What a row carries stays sealed; the row-level policy ("own library") keeps each account's
-- changes to its own devices.
alter publication supabase_realtime add table public.whiteboard_library;
