# -*- coding: utf-8 -*-
from __future__ import unicode_literals
# en-US # Import the translation module from frappe
# es-GT # Importe el modulo de traducción de frappe
from frappe import _
# en-US # Defines the icon attributes for the ERPNext Desktop icon.
# es-GT # Define los atributos para el icono del escritorio virtual ERPNext.

def get_data():
	return [
		{
			"module_name": "Factura Electrónica",
			"color": "grey",
			"icon": "octicon octicon-desktop-download",
			"type": "module",
			"label": __("Factura Electrónica")
		}
	]