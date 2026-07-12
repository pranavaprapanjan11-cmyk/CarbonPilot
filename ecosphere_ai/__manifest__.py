# -*- coding: utf-8 -*-
{
    'name': 'EcoSphere AI - Intelligent ESG Management Platform',
    'version': '1.0',
    'category': 'Human Resources/Sustainability',
    'summary': 'Measure, track, improve, and gamify Environmental, Social, and Governance (ESG) performance.',
    'description': """
EcoSphere AI is a premium ESG dashboard and enterprise tool that automates carbon calculations, 
manages social CSR tracking, administers policy and audit compliance, and gamifies eco-activities for employees.
    """,
    'author': 'Antigravity Odoo Architect',
    'website': 'https://www.ecosphere-ai.example',
    'license': 'OPL-1',
    'depends': ['base', 'hr', 'mail', 'web', 'board'],
    'data': [
        'security/security.xml',
        'security/ir.model.access.csv',
        'views/environmental_views.xml',
        'views/social_views.xml',
        'views/governance_views.xml',
        'views/gamification_views.xml',
        'views/dashboard_client_action.xml',
        'views/ecosphere_menus.xml',
        'wizards/audit_report_wizard_view.xml',
        'reports/esg_report_templates.xml',
    ],
    'demo': [],
    'assets': {
        'web.assets_backend': [
            'ecosphere_ai/static/src/css/ecosphere_dashboard.css',
            'ecosphere_ai/static/src/js/ecosphere_dashboard.js',
        ],
    },
    'installable': True,
    'application': True,
    'auto_install': False,
    'post_init_hook': 'post_init_hook',
}
