#!/usr/bin/env python3

import csv

input_file_name = "test.csv" #name/path of your csv file
template_file_name = "template.md" #name/path of your xml template
output_file_name = "{}.md"

with open(template_file_name,"r") as template_file:
    template = template_file.read()

with open(input_file_name,"r") as csv_file:
    my_reader = csv.DictReader(csv_file)
    for row in my_reader:
        with open(output_file_name.format(row["id"]),"w") as current_out:
            current_out.write(template.format(title=row["title"],
                                              description=row["abstract"],
                                              img=row["imageUrl"],
                                              featured=row["is_featured"]))
