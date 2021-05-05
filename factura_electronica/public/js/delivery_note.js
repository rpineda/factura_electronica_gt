import { valNit } from './facelec.js';
import { goalSeek } from './goalSeek.js';

// console.log("Hello world from Delivery Note");
/* Delivery Note (Nota de entrega) ------------------------------------------------------------------------------------------------------- */
function delivery_note_each_item(frm, cdt, cdn) {
    frm.doc.items.forEach((item) => {
        shs_delivery_note_calculation(frm, "Delivery Note Item", item.name);
    });
}

// Calculos para Nota de Entrega
function shs_delivery_note_calculation(frm, cdt, cdn) {
    cur_frm.refresh_fields();
    var this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;

    var this_row_amount = 0;
    var this_row_stock_qty = 0;
    var this_row_tax_rate = 0;
    var this_row_tax_amount = 0;
    var this_row_taxable_amount = 0;

    frm.doc.items.forEach((item_row, index) => {

        if (item_row.name == cdn) {
            this_row_amount = (item_row.qty * item_row.rate);
            this_row_stock_qty = (item_row.qty * item_row.conversion_factor);
            this_row_tax_rate = (item_row.shs_dn_tax_rate_per_uom);
            this_row_tax_amount = (this_row_stock_qty * this_row_tax_rate);
            this_row_taxable_amount = (this_row_amount - this_row_tax_amount);

            frm.doc.items[index].shs_dn_other_tax_amount = ((item_row.shs_dn_tax_rate_per_uom * (item_row.qty * item_row.conversion_factor)));
            //OJO!  No s epuede utilizar stock_qty en los calculos, debe de ser qty a puro tubo!
            frm.doc.items[index].shs_dn_amount_minus_excise_tax = ((item_row.qty * item_row.rate) - ((item_row.qty * item_row.conversion_factor) * item_row.shs_dn_tax_rate_per_uom));

            if (item_row.shs_dn_is_fuel) {
                frm.doc.items[index].shs_dn_gt_tax_net_fuel_amt = (item_row.shs_dn_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].shs_dn_sales_tax_for_this_row = (item_row.shs_dn_gt_tax_net_fuel_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check combustibles
                let total_fuel = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    if (d.shs_dn_is_fuel == true) {
                        total_fuel += flt(d.shs_dn_gt_tax_net_fuel_amt);
                    };
                });
                frm.doc.shs_dn_gt_tax_fuel = total_fuel;
            };

            if (item_row.shs_dn_is_good) {
                frm.doc.items[index].shs_dn_gt_tax_net_goods_amt = (item_row.shs_dn_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].shs_dn_sales_tax_for_this_row = (item_row.shs_dn_gt_tax_net_goods_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check bienes
                let total_goods = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    if (d.shs_dn_is_good == true) {
                        total_goods += flt(d.shs_dn_gt_tax_net_goods_amt);
                    };
                });
                frm.doc.shs_dn_gt_tax_goods = total_goods;
            };

            if (item_row.shs_dn_is_service) {
                frm.doc.items[index].shs_dn_gt_tax_net_services_amt = (item_row.shs_dn_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].shs_dn_sales_tax_for_this_row = (item_row.shs_dn_gt_tax_net_services_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check servicios
                let total_servi = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    if (d.shs_dn_is_service == true) {
                        total_servi += flt(d.shs_dn_gt_tax_net_services_amt);
                    };
                });
                frm.doc.shs_dn_gt_tax_services = total_servi;
            };

            let full_tax_iva = 0;
            $.each(frm.doc.items || [], function (i, d) {
                full_tax_iva += flt(d.shs_dn_sales_tax_for_this_row);
            });
            frm.doc.shs_dn_total_iva = full_tax_iva;
        };
    });
}

frappe.ui.form.on("Delivery Note", {
    onload_post_render: function (frm, cdt, cdn) {
        // en-US: Enabling event listeners for child tables
        // es-GT: Habilitando escuchadores de eventos en las tablas hijas del tipo de documento principal
        frm.fields_dict.items.grid.wrapper.on('focusout blur', 'input[data-fieldname="item_code"][data-doctype="Delivery Note Item"]', function (e) {
            shs_delivery_note_calculation(frm, cdt, cdn);
            delivery_note_each_item(frm, cdt, cdn);
        });

        frm.fields_dict.items.grid.wrapper.on('click', 'input[data-fieldname="uom"][data-doctype="Delivery Note Item"]', function (e) {
            delivery_note_each_item(frm, cdt, cdn);
        });

        frm.fields_dict.items.grid.wrapper.on('blur focusout', 'input[data-fieldname="uom"][data-doctype="Delivery Note Item"]', function (e) {
            delivery_note_each_item(frm, cdt, cdn);
        });

        // Do not refresh with each_item in Mouse leave! just recalculate
        frm.fields_dict.items.grid.wrapper.on('blur', 'input[data-fieldname="uom"][data-doctype="Delivery Note Item"]', function (e) {
            shs_delivery_note_calculation(frm, cdt, cdn);
        });

        // This part might seem counterintuitive, but it is the "next" field in tab order after item code, which helps for a "creative" strategy to update everything after pressing TAB out of the item code field.  FIXME
        frm.fields_dict.items.grid.wrapper.on('blur', 'input[data-fieldname="item_name"][data-doctype="Delivery Note Item"]', function (e) {
            delivery_note_each_item(frm, cdt, cdn);
        });

        frm.fields_dict.items.grid.wrapper.on('blur focusout', 'input[data-fieldname="qty"][data-doctype="Delivery Note Item"]', function (e) {
            delivery_note_each_item(frm, cdt, cdn);
        });

        // Do not refresh with each_item in Mouse leave! just recalculate
        frm.fields_dict.items.grid.wrapper.on('blur', 'input[data-fieldname="qty"][data-doctype="Delivery Note Item"]', function (e) {
            delivery_note_each_item(frm, cdt, cdn);
            shs_delivery_note_calculation(frm, cdt, cdn);
        });

        // DO NOT USE Keyup, ??  FIXME FIXME FIXME FIXME FIXME  este hace calculos bien
        frm.fields_dict.items.grid.wrapper.on('blur focusout', 'input[data-fieldname="conversion_factor"][data-doctype="Delivery Note Item"]', function (e) {
            //  IMPORTANT! IMPORTANT!  This is the one that gets the calculations correct!
            // Trying to calc first, then refresh, or no refresh at all...
            delivery_note_each_item(frm, cdt, cdn);
            cur_frm.refresh_field("conversion_factor");
        });

        // This specific one is only for keyup events, to recalculate all. Only on blur will it refresh everything!
        // Do not refresh with each_item in Mouse leave OR keyup! just recalculate
        frm.fields_dict.items.grid.wrapper.on('blur focusout', 'input[data-fieldname="conversion_factor"][data-doctype="Delivery Note Item"]', function (e) {
            // Trying to calc first, then refresh, or no refresh at all...
            shs_delivery_note_calculation(frm, cdt, cdn);
            delivery_note_each_item(frm, cdt, cdn);
            cur_frm.refresh_field("conversion_factor");
        });

        // en-US: Enabling event listeners in the main doctype
        // es-GT: Habilitando escuchadores de eventos en el tipo de documento principal
        // When ANY key is released after being pressed
        // cur_frm.fields_dict.customer.$input.on("keyup", function (evt) {
        //     shs_delivery_note_calculation(frm, cdt, cdn);
        //     delivery_note_each_item(frm, cdt, cdn);
        //     refresh_field('qty');
        // });

        // When mouse leaves the field
        cur_frm.fields_dict.customer.$input.on("blur focusout", function (evt) {
            shs_delivery_note_calculation(frm, cdt, cdn);
        });

        // Mouse clicks over the items field
        cur_frm.fields_dict.items.$wrapper.on("blur focusout", function (evt) {
            delivery_note_each_item(frm, cdt, cdn);
        });

        // Focusout from the field
        cur_frm.fields_dict.taxes_and_charges.$input.on("blur focusout", function (evt) {
            shs_delivery_note_calculation(frm, cdt, cdn);
        });
    },
    shs_dn_nit: function (frm) {
        // Funcion para validar NIT: Se ejecuta cuando exista un cambio en el campo de NIT
        // Para expriencia mas agradable se valida desde el cliente
        // valNit(frm.doc.shs_dn_nit, frm.doc.customer, frm);
    },
    discount_amount: function (frm) {
        // Trigger Monto de descuento
        var tax_before_calc = frm.doc.shs_dn_total_iva;
        // es-GT: Este muestra el IVA que se calculo por medio de nuestra aplicación.
        var discount_amount_net_value = (frm.doc.discount_amount / (1 + (cur_frm.doc.taxes[0].rate / 100)));

        if (discount_amount_net_value == NaN || discount_amount_net_value == undefined) {
        } else {
            discount_amount_tax_value = (discount_amount_net_value * (cur_frm.doc.taxes[0].rate / 100));
            frm.doc.shs_dn_total_iva = (frm.doc.shs_dn_total_iva - discount_amount_tax_value);
        }
    },
    before_save: function (frm, cdt, cdn) {
        delivery_note_each_item(frm, cdt, cdn);
    },
});

frappe.ui.form.on("Delivery Note Item", {
    items_remove: function (frm) {
        // es-GT: Este disparador corre al momento de eliminar una nueva fila.
        // en-US: This trigger runs when removing a row.
        // Vuelve a calcular los totales de FUEL, GOODS, SERVICES e IVA cuando se elimina una fila.

        var fix_gt_tax_fuel = 0;
        var fix_gt_tax_goods = 0;
        var fix_gt_tax_services = 0;
        var fix_gt_tax_iva = 0;

        $.each(frm.doc.items || [], function (i, d) {
            fix_gt_tax_fuel += flt(d.shs_dn_gt_tax_net_fuel_amt);
            fix_gt_tax_goods += flt(d.shs_dn_gt_tax_net_goods_amt);
            fix_gt_tax_services += flt(d.shs_dn_gt_tax_net_services_amt);
            fix_gt_tax_iva += flt(d.shs_dn_sales_tax_for_this_row);
        });

        cur_frm.set_value("shs_dn_gt_tax_fuel", fix_gt_tax_fuel);
        cur_frm.set_value("shs_dn_gt_tax_goods", fix_gt_tax_goods);
        cur_frm.set_value("shs_dn_gt_tax_services", fix_gt_tax_services);
        cur_frm.set_value("shs_dn_total_iva", fix_gt_tax_iva);
    },
    item_code: function (frm, cdt, cdn) {
        // Trigger codigo de producto
        refresh_field('qty');
    },
    qty: function (frm, cdt, cdn) {
        // Trigger cantidad
        shs_delivery_note_calculation(frm, cdt, cdn);
    },
    conversion_factor: function (frm, cdt, cdn) {
        // Trigger factor de conversion
        shs_delivery_note_calculation(frm, cdt, cdn);
    },
    rate: function (frm, cdt, cdn) {
        shs_delivery_note_calculation(frm, cdt, cdn);
    },
    shs_amount_for_back_calc: function (frm, cdt, cdn) {
        frm.doc.items.forEach((row, index) => {
            var a = row.rate;
            var b = row.qty;
            var c = row.amount;

            //let test = flt(row.shs_amount_for_back_calc) - flt(c);
            //let testB = test / 2;

            // Usando metodologia GoalSeek.js
            // https://github.com/adam-hanna/goalSeek.js/blob/master/goalSeek.js
            // console.log(goalSeek({
            //     Func: calculo_redondeo_pi,
            //     aFuncParams: [b, a],
            //     oFuncArgTarget: {
            //         Position: 0
            //     },
            //     Goal: row.shs_amount_for_back_calc,
            //     Tol: 0.001,
            //     maxIter: 10000
            // }));
            let calcu = goalSeek({
                Func: redondeo_delivery_note,
                aFuncParams: [b, a],
                oFuncArgTarget: {
                    Position: 0
                },
                Goal: row.shs_amount_for_back_calc,
                Tol: 0.001,
                maxIter: 10000
            });
            console.log(calcu);

            frm.doc.items[index].qty = calcu;
            frm.doc.items[index].stock_qty = calcu;
            frm.doc.items[index].amount = calcu * frm.doc.items[index].rate;
            frm.refresh_field("items");
        });
    }
});

function redondeo_delivery_note(a, b) {
    return a * b;
}
/* ----------------------------------------------------------------------------------------------------------------- */