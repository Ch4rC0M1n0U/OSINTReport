#!/usr/bin/env python3
"""Corriger le caractère corrompu dans ReportDetailPage.vue"""

with open('/workspaces/OSINTReport/frontend/src/pages/reports/ReportDetailPage.vue', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Ligne 705 (index 704) : remplacer le caractère corrompu par l'émoji correct
if len(lines) > 704:
    lines[704] = '                  <span class="text-lg">🔗</span>\n'
    
with open('/workspaces/OSINTReport/frontend/src/pages/reports/ReportDetailPage.vue', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("✅ Caractère corrompu corrigé !")
