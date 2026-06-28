' Script name: PreviewNext
'
' Automatically puts the next input into preview after each transition.
' If the active input is the last one, vMix will ignore the out-of-range preview request gracefully.

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " PreviewNext 1.0.0")

' ===== Configurations =====
Dim LOOP_TIME As Integer = 300  ' Poll interval in ms
Dim DELAY_TIME As Integer = 1000  ' How long to wait after a transition before updating preview

Dim lastActive As String = ""
Dim xml As New System.Xml.XmlDocument()

Do While True
    Sleep(LOOP_TIME)

    Try
        xml.LoadXml(API.XML())

        Dim active As String = xml.SelectSingleNode("//active").InnerText

        If lastActive <> active Then
            Sleep(DELAY_TIME)
            lastActive = active
            Dim nextInput As String = CStr(CInt(lastActive) + 1)
            timestamp = DateTime.Now.ToString("HH:mm:ss")
            Console.WriteLine(timestamp & " PreviewNext | Updating preview: " & nextInput)
            API.Function("PreviewInput", Input:=nextInput)
            Continue Do
        End If

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " PreviewNext | Unexpected error: " & ex.Message)
    End Try
Loop
