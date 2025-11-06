#!/usr/bin/env python3
"""
Script pour nettoyer ReportDetailPage.vue en supprimant le code dupliqué
"""

# Lire le fichier
with open('/workspaces/OSINTReport/frontend/src/pages/reports/ReportDetailPage.vue', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Garder les lignes 1-898 (script + nouveau template) et 1164+ (modals)
cleaned_lines = lines[:898] + lines[1163:]

# Écrire le fichier nettoyé
with open('/workspaces/OSINTReport/frontend/src/pages/reports/ReportDetailPage.vue', 'w', encoding='utf-8') as f:
    f.writelines(cleaned_lines)

print(f"✅ Fichier nettoyé ! {len(lines)} lignes → {len(cleaned_lines)} lignes")
print(f"   Supprimé : {len(lines) - len(cleaned_lines)} lignes dupliquées")
