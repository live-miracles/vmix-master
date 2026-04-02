' Script name: PreviewNext
' 
' The script will automatically put the next input in the preview after transition

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " PreviewNext 0.0.0")

' ===== Configurations =====
Dim LOOP_TIME = 300  ' Wait time between each loop iteration
Dim DELAY_TIME As Integer = 1000  ' How long to wait after transition

' ====== Timestamps ======
Dim lastActive = ""
Dim xml = New System.Xml.XmlDocument()

Do While True
    Sleep(LOOP_TIME)

    Try
        ' Load vMix XML
        xml.LoadXml(API.XML())
        timestamp = DateTime.Now.ToString("HH:mm:ss")

        Dim active = xml.SelectSingleNode("//active").InnerText

        If lastActive <> active Then
            Sleep(DELAY_TIME)
            lastActive = active
            Dim nextInput = (CInt(lastActive) + 1).ToString()
            Console.WriteLine(timestamp & " PreviewNext | Updating preview: " & nextInput)
            API.Function("PreviewInput", Input:=nextInput)
            Continue Do
        End If

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " PreviewNext | Unexpected error: " & ex.Message)
    End Try
Loop
