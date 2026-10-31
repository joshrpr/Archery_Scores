# Delete unfinished rounds from Home

Issue #28. Long press (550ms) or the visible 44px options control opens the same round-specific confirmation. The format, date, note and all archer names identify the record; Cancel receives initial focus. Ordinary taps still resume scoring.

- `home.jpg`: options control on a sample unfinished Vegas card, separate from its resume button.
- `confirmation.jpg`: confirmation naming the affected round and warning that every archer's scores in that round are removed. This capture was cancelled; no preview data was deleted.

Verified with 14 Home/navigation/gesture checks, followed by six deletion/offline checks after final focus handling; 28 domain/delivery tests and 61 branding exports also pass. Coverage includes solo/group records, cancellation/focus restoration, deletion surviving reload, the last unfinished round, pointer movement cancelling holds, keyboard and Android-style context menu, 200% text, and storage failure rolling back the in-memory removal. Existing completion/history deletion is outside this feature.

Browser captures use the separate sample-data preview origin. Physical Pixel gesture acceptance remains a phone-preview check.
