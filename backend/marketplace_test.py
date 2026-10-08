from pathlib import Path
import ast

source = Path(__file__).with_name("server.py").read_text(encoding="utf-8")
tree = ast.parse(source)
names = {n.name for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))}
required = {"create_marketplace_request","get_marketplace_request","create_pharmacy_quotation","create_lab_quotation","accept_marketplace_quotation","provider_marketplace_requests","admin_marketplace","upload_file"}
assert not required - names

def get_fn(name):
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == name:
            return node
    raise AssertionError(name)

ns = {"Optional": object, "List": list, "Dict": dict, "Any": object}
for helper in ("_norm_item","_coverage_count","_all_items_covered","_quote_rank"):
    node = get_fn(helper)
    exec(compile(ast.Module(body=[node], type_ignores=[]), "<helper>", "exec"), ns)

assert ns["_all_items_covered"](["Paracetamol", "Azithromycin"], [{"name":"Paracetamol","quantity":1},{"name":"Azithromycin","quantity":1}])
assert not ns["_all_items_covered"](["Paracetamol", "Azithromycin"], [{"name":"Paracetamol","quantity":1}])
assert ns["_quote_rank"]({"total_price":100,"eta_minutes":20}) < ns["_quote_rank"]({"total_price":120,"eta_minutes":5})
assert ns["_quote_rank"]({"total_price":100,"eta_minutes":10}) < ns["_quote_rank"]({"total_price":100,"eta_minutes":20})
print("Marketplace logic checks passed.")
