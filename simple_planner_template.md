# Simple Planner Template (Dựa trên User's Actual Prompts)

## 📝 **Main Prompt Template**

```
Tôi muốn thiết kế và thực hiện một tính năng [TÊN_TÍNH_NĂNG] cho project hiện tại.

[Đính kèm các files cần thiết:]
- Database: [stored procedures, schema, sample data results]
- UI: [mockup files, design specs]  
- Context: [technical requirements, business logic]

Bây giờ bạn hãy sử dụng planner tool trong serena để lên một plan thực hiện chi tiết giúp tôi. 

Bạn phải suy nghĩ thật kỹ và sử dụng sequential-thinking tool để suy nghĩ từng step một. 

Plan phải giống một blueprint cho junior dev có thể dựa vào làm được. Đây đủ context để một agent coding bình thường cũng làm được.

QUAN TRỌNG: Bạn hãy đọc kỹ codebase hiện tại trước khi tạo plan để đảm bảo architecture compatibility.
```

## 🔧 **Correction Prompt (nếu plan không phù hợp)**

```
Tôi có câu hỏi, planner tool có đọc các file trong .memories không? Tại sao cấu trúc thư mục lại không giống với project hiện tại?

Bạn đọc kỹ codebase hiện tại và cập nhật lại plan giúp tôi. Xóa plan cũ đi.
```

## 🎯 **Workflow Process**

### Step 1: Main Request
1. Mô tả tính năng cần implement
2. Đính kèm technical context (DB, UI, specs)
3. Yêu cầu sử dụng sequential-thinking + planner tools
4. Specify quality requirement: blueprint cho junior dev

### Step 2: Quality Check  
Sau khi nhận plan đầu tiên:
- Check xem plan có match với project architecture không
- Nếu không match → sử dụng correction prompt

### Step 3: Correction (nếu cần)
- Point out architecture mismatch
- Request codebase exploration  
- Request plan revision
- Delete old plan và tạo mới

## 📋 **Template Usage Example**

```
Tôi muốn thiết kế và thực hiện một tính năng Product Management Dashboard cho project hiện tại.

[Đính kèm files:]
- Database: product_schema.sql, sample_queries.sql
- UI: dashboard_mockup.html, wireframes.png
- Context: product_requirements.md

Bây giờ bạn hãy sử dụng planner tool trong serena để lên một plan thực hiện chi tiết giúp tôi. 

Bạn phải suy nghĩ thật kỹ và sử dụng sequential-thinking tool để suy nghĩ từng step một. 

Plan phải giống một blueprint cho junior dev có thể dựa vào làm được. Đây đủ context để một agent coding bình thường cũng làm được.

QUAN TRỌNG: Bạn hãy đọc kỹ codebase hiện tại trước khi tạo plan để đảm bảo architecture compatibility.
```

## ⚡ **Key Points**

- **Language style**: Giữ nguyên Vietnamese + English mix như user's style
- **Tool requirements**: Explicitly mention sequential-thinking + planner tools
- **Quality standard**: "Blueprint cho junior dev có thể dựa vào làm được"  
- **Context sufficiency**: "Đủ context cho agent coding bình thường"
- **Prevention mechanism**: Mandatory codebase exploration
- **Correction flow**: Clear steps for plan revision

## 🚀 **Usage Instructions**

1. **Replace [TÊN_TÍNH_NĂNG]** với tên tính năng thực tế
2. **Attach technical files** (database, UI, specs)
3. **Submit prompt** tới agent
4. **Check plan quality** và architecture compatibility
5. **Use correction prompt** nếu plan không phù hợp

Template này dựa trên exact workflow mà bạn đã experience trong conversation này!